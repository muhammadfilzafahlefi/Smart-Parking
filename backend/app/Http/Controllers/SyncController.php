<?php

namespace App\Http\Controllers;

use App\Models\ArrivalVerification;
use App\Models\IotDevice;
use App\Models\ParkingSlot;
use App\Models\Reservation;
use App\Models\StoreSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SyncController extends Controller
{
    /**
     * Get the centralized store data synchronized with the database and ESP32.
     */
    public function getStore(): JsonResponse
    {
        $snapshot = StoreSnapshot::find(1);
        $store = $snapshot?->data ?? $this->loadStore();
        $storeSource = $snapshot ? 'database' : ($store !== null ? 'legacy' : 'empty');
        if ($store !== null) {
            $unfilteredStore = $store;
            $store = $this->filterDeletedReservationData($store);
            $store = $this->filterReportedArrivalData($store);
            if ($store !== $unfilteredStore) {
                $this->saveStore($store);
            }
        }

        // 1. Overlay live physical slot states updated by ESP32.
        $dbSlots = ParkingSlot::orderBy('id')->get();
        if ($dbSlots->isNotEmpty() && isset($store['parking_slots'])) {
            foreach ($store['parking_slots'] as &$storeSlot) {
                $matched = $dbSlots->firstWhere('slot_code', $storeSlot['slot_code']);
                if ($matched) {
                    $storeSlot['sensor_value'] = (int) $matched->sensor_value;
                    $storeSlot['physical_status'] = $matched->physical_status;
                    $storeSlot['is_occupied'] = ($matched->physical_status === 'occupied');
                    $storeSlot['last_detected_at'] = $matched->last_detected_at ? $matched->last_detected_at->toIso8601String() : $storeSlot['last_detected_at'];
                }
            }
            unset($storeSlot);
        }

        // 2. Discover ESP32 IP
        $esp32Ip = cache()->get('smart_parking_esp32_ip', '192.168.113.12');
        if (isset($store['iot_devices']) && count($store['iot_devices']) > 0) {
            $store['iot_devices'][0]['ip_address'] = $esp32Ip;
            $store['iot_devices'][0]['status'] = 'online';
            $store['iot_devices'][0]['last_seen_at'] = now()->toIso8601String();
        }

        return response()->json([
            'success' => true,
            'data' => $store,
            'initialized' => $store !== null,
            'source' => $storeSource,
            'esp32_ip' => $esp32Ip,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Update the centralized store data (called when user books, pays, or modifies data).
     */
    public function updateStore(Request $request): JsonResponse
    {
        $incoming = $request->input('data');
        if (!$incoming || !is_array($incoming)) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
            ], 400);
        }

        $currentStore = $this->loadStore() ?? [];

        // Merge incoming collections safely
        $keysToSync = ['users', 'sensor_logs', 'parking_sessions', 'arrival_verifications', 'pending_arrival', 'pending_arrivals', 'payment_verification_alerts', 'settings'];
        foreach ($keysToSync as $key) {
            if (array_key_exists($key, $incoming)) {
                $currentStore[$key] = $incoming[$key];
            }
        }
        if (isset($incoming['reservations']) && is_array($incoming['reservations'])) {
            $currentStore['reservations'] = $this->mergeReservationRows(
                $currentStore['reservations'] ?? [],
                $incoming['reservations']
            );
        }
        if (isset($incoming['payments']) && is_array($incoming['payments'])) {
            $currentStore['payments'] = $this->mergePaymentRows(
                $currentStore['payments'] ?? [],
                $incoming['payments']
            );
        }
        if (isset($incoming['arrival_identity_reports']) && is_array($incoming['arrival_identity_reports'])) {
            $currentStore['arrival_identity_reports'] = $this->mergeArrivalIdentityReportRows(
                $currentStore['arrival_identity_reports'] ?? [],
                $incoming['arrival_identity_reports']
            );
        }
        $currentStore['deleted_reservation_ids'] = array_values(array_unique(array_filter(
            array_map('intval', array_merge(
                is_array($currentStore['deleted_reservation_ids'] ?? null) ? $currentStore['deleted_reservation_ids'] : [],
                is_array($incoming['deleted_reservation_ids'] ?? null) ? $incoming['deleted_reservation_ids'] : []
            )),
            static fn (int $id): bool => $id > 0
        )));

        // If client updated parking_slots (e.g. through simulator or manual toggle)
        if (isset($incoming['parking_slots']) && is_array($incoming['parking_slots'])) {
            $currentStore['parking_slots'] = $incoming['parking_slots'];

            foreach ($incoming['parking_slots'] as $slotData) {
                if (isset($slotData['slot_code'])) {
                    ParkingSlot::where('slot_code', $slotData['slot_code'])->update([
                        'sensor_value' => $slotData['sensor_value'] ?? 3200,
                        'physical_status' => $slotData['physical_status'] ?? (!empty($slotData['is_occupied']) ? 'occupied' : 'empty'),
                        'last_detected_at' => now(),
                    ]);
                }
            }
        }

        $currentStore = $this->filterDeletedReservationData($currentStore);
        $currentStore = $this->filterReportedArrivalData($currentStore);
        $this->saveStore($currentStore);

        return response()->json([
            'success' => true,
            'data' => $currentStore,
            'message' => 'Data berhasil disinkronisasi ke server pusat.',
        ]);
    }

    public function uploadPaymentProof(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'proof_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            'reservation_code' => 'required|string|max:50',
        ]);

        $file = $request->file('proof_image');
        $extension = $file->guessExtension();
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Format bukti pembayaran tidak didukung.',
            ], 422);
        }

        $fileName = Str::uuid()->toString() . '.' . $extension;
        $path = $file->storeAs('payment-proofs', $fileName, 'local');
        if (!$path) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti pembayaran gagal disimpan di server.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'path' => '/api/sync/payment-proofs/' . $fileName,
            ],
        ], 201);
    }

    public function showPaymentProof(string $fileName)
    {
        if (!preg_match('/^[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i', $fileName)) {
            abort(404);
        }

        $path = 'payment-proofs/' . $fileName;
        abort_unless(Storage::disk('local')->exists($path), 404);

        $response = Storage::disk('local')->response($path);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    /**
     * Helper to load store JSON or initialize default.
     */
    protected function loadStore(): ?array
    {
        $snapshot = StoreSnapshot::find(1);
        if ($snapshot) {
            return $snapshot->data;
        }

        $legacyPath = storage_path('app/smart_parking_store.json');
        if (File::exists($legacyPath)) {
            $content = File::get($legacyPath);
            $decoded = json_decode($content, true);
            if (!is_array($decoded) || !isset($decoded['parking_slots']) || !isset($decoded['reservations'])) {
                throw new \RuntimeException('Legacy Smart Parking store contains invalid JSON or data.');
            }

            return $decoded;
        }

        return null;
    }

    protected function saveStore(array $data): void
    {
        StoreSnapshot::updateOrCreate(['id' => 1], ['data' => $data]);
    }

    protected function filterDeletedReservationData(array $store): array
    {
        $deletedIds = array_values(array_unique(array_filter(
            array_map('intval', is_array($store['deleted_reservation_ids'] ?? null) ? $store['deleted_reservation_ids'] : []),
            static fn (int $id): bool => $id > 0
        )));
        if ($deletedIds === []) {
            return $store;
        }

        $isDeletedId = static fn ($id): bool => in_array((int) $id, $deletedIds, true);
        foreach ([
            'reservations' => 'id',
            'payments' => 'reservation_id',
            'parking_sessions' => 'reservation_id',
            'arrival_verifications' => 'reservation_id',
            'arrival_identity_reports' => 'reservation_id',
            'payment_verification_alerts' => 'reservation_id',
        ] as $collection => $idField) {
            if (isset($store[$collection]) && is_array($store[$collection])) {
                $store[$collection] = array_values(array_filter(
                    $store[$collection],
                    static fn ($row): bool => !$isDeletedId($row[$idField] ?? null)
                ));
            }
        }

        if (isset($store['pending_arrivals']) && is_array($store['pending_arrivals'])) {
            $store['pending_arrivals'] = array_values(array_filter(
                $store['pending_arrivals'],
                static fn ($row): bool => !$isDeletedId($row['reservation']['id'] ?? $row['reservation_id'] ?? null)
            ));
        }

        if ($isDeletedId($store['pending_arrival']['reservation_id'] ?? $store['pending_arrival']['reservation']['id'] ?? null)) {
            $store['pending_arrival'] = null;
        }

        return $store;
    }

    protected function filterReportedArrivalData(array $store): array
    {
        $reportedReservationIds = [];
        foreach ($store['arrival_identity_reports'] ?? [] as $report) {
            if (is_array($report) && isset($report['reservation_id'])) {
                $reportedReservationIds[(string) $report['reservation_id']] = true;
            }
        }
        if ($reportedReservationIds === []) {
            return $store;
        }

        $isReported = static fn ($id): bool => isset($reportedReservationIds[(string) $id]);
        if (isset($store['pending_arrivals']) && is_array($store['pending_arrivals'])) {
            $store['pending_arrivals'] = array_values(array_filter(
                $store['pending_arrivals'],
                static fn ($row): bool => !$isReported($row['reservation']['id'] ?? $row['reservation_id'] ?? null)
            ));
        }

        if ($isReported($store['pending_arrival']['reservation_id'] ?? $store['pending_arrival']['reservation']['id'] ?? null)) {
            $store['pending_arrival'] = null;
        }

        return $store;
    }

    protected function mergeArrivalIdentityReportRows(array $currentRows, array $incomingRows): array
    {
        $rowsById = [];
        foreach ($currentRows as $row) {
            if (is_array($row) && isset($row['id'])) {
                $rowsById[(string) $row['id']] = $row;
            }
        }

        foreach ($incomingRows as $incoming) {
            if (!is_array($incoming) || !isset($incoming['id'])) {
                continue;
            }

            $id = (string) $incoming['id'];
            $current = $rowsById[$id] ?? [];
            $rowsById[$id] = ($current['status'] ?? null) === 'resolved' && ($incoming['status'] ?? null) !== 'resolved'
                ? $current
                : array_merge($current, $incoming);
        }

        return array_values($rowsById);
    }

    protected function mergeReservationRows(array $currentRows, array $incomingRows): array
    {
        $rowsById = [];
        foreach ($currentRows as $row) {
            if (is_array($row) && isset($row['id'])) {
                $rowsById[(string) $row['id']] = $row;
            }
        }

        foreach ($incomingRows as $incoming) {
            if (!is_array($incoming) || !isset($incoming['id'])) {
                continue;
            }

            $id = (string) $incoming['id'];
            if (!isset($rowsById[$id])) {
                $rowsById[$id] = $incoming;
                continue;
            }

            $current = $rowsById[$id];
            $merged = array_merge($current, $incoming);
            $currentStatus = $current['status'] ?? null;
            $incomingStatus = $incoming['status'] ?? null;
            $preserveStatus = $currentStatus === 'completed'
                || ($currentStatus === 'active' && in_array($incomingStatus, [
                    'pending_payment', 'waiting_verification', 'confirmed', 'waiting_arrival', 'rejected',
                ], true))
                || ($currentStatus === 'confirmed' && in_array($incomingStatus, [
                    'pending_payment', 'waiting_verification', 'rejected',
                ], true))
                || (in_array($currentStatus, ['cancelled', 'expired'], true) && in_array($incomingStatus, [
                    'pending_payment', 'waiting_verification', 'confirmed', 'waiting_arrival', 'active', 'rejected',
                ], true));

            if ($preserveStatus) {
                $merged['status'] = $currentStatus;
                if (!empty($current['arrival_confirmed_at'])) {
                    $merged['arrival_confirmed_at'] = $current['arrival_confirmed_at'];
                }
            }

            $rowsById[$id] = $merged;
        }

        return array_values($rowsById);
    }

    protected function mergePaymentRows(array $currentRows, array $incomingRows): array
    {
        $rowsById = [];
        foreach ($currentRows as $row) {
            if (is_array($row) && isset($row['id'])) {
                $rowsById[(string) $row['id']] = $row;
            }
        }

        foreach ($incomingRows as $incoming) {
            if (!is_array($incoming) || !isset($incoming['id'])) {
                continue;
            }

            $id = (string) $incoming['id'];
            if (isset($rowsById[$id]) && ($rowsById[$id]['status'] ?? null) === 'approved'
                && ($incoming['status'] ?? null) !== 'approved') {
                continue;
            }

            $rowsById[$id] = isset($rowsById[$id])
                ? array_merge($rowsById[$id], $incoming)
                : $incoming;
        }

        return array_values($rowsById);
    }

    /**
     * Initial Seed Store matching INITIAL_DB from js/data.js.
     */
    protected function getDefaultStore(): array
    {
        return [
            'users' => [
                ['id' => 1, 'name' => 'Administrator Smart Parking', 'email' => 'admin@smartparking.id', 'password' => 'admin', 'phone' => '081234567890', 'role' => 'admin', 'created_at' => '2026-11-01 08:00:00'],
                ['id' => 2, 'name' => 'Budi Santoso', 'email' => 'budi@example.com', 'password' => 'user123', 'phone' => '081987654321', 'role' => 'user', 'created_at' => '2026-11-02 09:30:00'],
                ['id' => 3, 'name' => 'Siti Rahma', 'email' => 'siti@example.com', 'password' => 'user123', 'phone' => '085612345678', 'role' => 'user', 'created_at' => '2026-11-05 14:20:00'],
                ['id' => 4, 'name' => 'Ahmad Dani', 'email' => 'ahmad@example.com', 'password' => 'user123', 'phone' => '087788990011', 'role' => 'user', 'created_at' => '2026-11-08 11:15:00'],
                ['id' => 5, 'name' => 'Administrator Super', 'email' => 'admin@smartparking.com', 'password' => 'admin', 'phone' => '081234567899', 'role' => 'admin', 'created_at' => '2026-11-01 08:00:00'],
                ['id' => 6, 'name' => 'Pengguna Smart Parking', 'email' => 'user@smartparking.com', 'password' => 'user123', 'phone' => '081299998888', 'role' => 'user', 'created_at' => '2026-11-01 08:00:00'],
            ],
            'iot_devices' => [
                [
                    'id' => 1,
                    'device_code' => 'ESP32_PARKING_01',
                    'ip_address' => '192.168.113.12',
                    'mac_address' => '24:6F:28:B2:91:AC',
                    'firmware_version' => 'v1.2.0-PROD',
                    'status' => 'online',
                    'last_seen_at' => now()->toIso8601String(),
                    'heartbeat_interval' => 30,
                    'monitored_slots' => ['A01', 'A02', 'A03', 'A04'],
                ],
            ],
            'parking_slots' => [
                ['id' => 1, 'slot_code' => 'A01', 'sensor_value' => 4095, 'is_occupied' => false, 'physical_status' => 'empty', 'last_detected_at' => now()->toIso8601String()],
                ['id' => 2, 'slot_code' => 'A02', 'sensor_value' => 4095, 'is_occupied' => false, 'physical_status' => 'empty', 'last_detected_at' => now()->toIso8601String()],
                ['id' => 3, 'slot_code' => 'A03', 'sensor_value' => 4095, 'is_occupied' => false, 'physical_status' => 'empty', 'last_detected_at' => now()->toIso8601String()],
                ['id' => 4, 'slot_code' => 'A04', 'sensor_value' => 4095, 'is_occupied' => false, 'physical_status' => 'empty', 'last_detected_at' => now()->toIso8601String()],
            ],
            'reservations' => [
                [
                    'id' => 1,
                    'reservation_code' => 'RSV-20261110-0001',
                    'user_id' => 2,
                    'parking_slot_id' => 2,
                    'vehicle_plate' => 'B 1234 XYZ',
                    'start_time' => '2026-11-10T14:00',
                    'end_time' => '2026-11-10T18:00',
                    'total_price' => 20000,
                    'status' => 'active',
                    'arrival_confirmed_at' => '2026-11-10T14:05:22',
                    'created_at' => '2026-11-10T13:30:00',
                ],
                [
                    'id' => 2,
                    'reservation_code' => 'RSV-20261110-0002',
                    'user_id' => 3,
                    'parking_slot_id' => 1,
                    'vehicle_plate' => 'D 5678 KLM',
                    'start_time' => '2026-11-10T19:00',
                    'end_time' => '2026-11-10T21:00',
                    'total_price' => 10000,
                    'status' => 'waiting_verification',
                    'arrival_confirmed_at' => null,
                    'created_at' => '2026-11-10T15:20:00',
                ],
                [
                    'id' => 3,
                    'reservation_code' => 'RSV-20261110-0003',
                    'user_id' => 4,
                    'parking_slot_id' => 4,
                    'vehicle_plate' => 'B 9999 PRO',
                    'start_time' => '2026-11-10T10:00',
                    'end_time' => '2026-11-10T14:00',
                    'total_price' => 20000,
                    'status' => 'completed',
                    'arrival_confirmed_at' => '2026-11-10T10:04:12',
                    'created_at' => '2026-11-10T09:15:00',
                ],
                [
                    'id' => 4,
                    'reservation_code' => 'RSV-20261110-0004',
                    'user_id' => 2,
                    'parking_slot_id' => 3,
                    'vehicle_plate' => 'B 1234 XYZ',
                    'start_time' => '2026-11-10T20:00',
                    'end_time' => '2026-11-10T22:00',
                    'total_price' => 10000,
                    'status' => 'pending_payment',
                    'arrival_confirmed_at' => null,
                    'created_at' => '2026-11-10T16:00:00',
                ],
            ],
            'payments' => [
                [
                    'id' => 1,
                    'reservation_id' => 1,
                    'amount' => 20000,
                    'payment_method' => 'Transfer Bank BCA',
                    'proof_image' => 'assets/sample_receipt_1.svg',
                    'status' => 'approved',
                    'verified_by' => 1,
                    'rejection_reason' => null,
                    'verified_at' => '2026-11-10T13:40:00',
                    'created_at' => '2026-11-10T13:35:00',
                ],
                [
                    'id' => 2,
                    'reservation_id' => 2,
                    'amount' => 10000,
                    'payment_method' => 'Transfer Bank BCA',
                    'proof_image' => 'assets/sample_receipt_2.svg',
                    'status' => 'pending',
                    'verified_by' => null,
                    'rejection_reason' => null,
                    'verified_at' => null,
                    'created_at' => '2026-11-10T15:25:00',
                ],
                [
                    'id' => 3,
                    'reservation_id' => 3,
                    'amount' => 20000,
                    'payment_method' => 'Transfer Bank Mandiri',
                    'proof_image' => 'assets/sample_receipt_1.svg',
                    'status' => 'approved',
                    'verified_by' => 1,
                    'rejection_reason' => null,
                    'verified_at' => '2026-11-10T09:45:00',
                    'created_at' => '2026-11-10T09:30:00',
                ],
                [
                    'id' => 4,
                    'reservation_id' => 4,
                    'amount' => 10000,
                    'payment_method' => 'Transfer Bank BCA',
                    'proof_image' => null,
                    'status' => 'unpaid',
                    'verified_by' => null,
                    'rejection_reason' => null,
                    'verified_at' => null,
                    'created_at' => '2026-11-10T16:00:00',
                ],
            ],
            'sensor_logs' => [],
            'parking_sessions' => [
                ['id' => 1, 'reservation_id' => 1, 'check_in' => '2026-11-10 14:05:22', 'check_out' => null, 'status' => 'active', 'created_at' => '2026-11-10 14:05:22'],
            ],
            'arrival_verifications' => [],
            'pending_arrival' => null,
            'pending_arrivals' => [],
            'payment_verification_alerts' => [],
            'settings' => [
                'tariff_per_hour' => 5000,
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_no' => '8830-1928-100',
                'bank_account_name' => 'Smart Parking System Official',
                'sensor_threshold' => 2000,
                'heartbeat_interval' => 30,
                'currency' => 'IDR',
            ],
        ];
    }
}

