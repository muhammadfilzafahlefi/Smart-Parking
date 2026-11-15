<?php

namespace App\Http\Controllers\IoT;

use App\Http\Controllers\Controller;
use App\Models\ArrivalVerification;
use App\Models\IotDevice;
use App\Models\ParkingSlot;
use App\Models\Reservation;
use App\Models\SensorLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IoTController extends Controller
{
    /**
     * Handle sensor data updates from ESP32 (FR-PARK-002, FR-ARR-001, FR-ARR-002)
     */
    public function sensorUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots' => 'required|array|min:1|max:4',
            'slots.*.slot_code' => 'required|string|exists:parking_slots,slot_code',
            'slots.*.sensor_value' => 'required|integer|min:0|max:4095',
            'slots.*.status' => 'required|in:empty,occupied,unknown',
        ]);
        $device = $request->attributes->get('iot_device');
        $deviceCode = $device->device_code;
        $slotsData = $validated['slots'];

        $now = now();

        // Record ESP32 IP
        $clientIp = $request->input('ip_address') ?? $request->ip() ?? '192.168.113.12';
        if ($clientIp === '127.0.0.1' || $clientIp === '::1') {
            $clientIp = '192.168.113.12';
        }
        cache()->put('smart_parking_esp32_ip', $clientIp, now()->addMinutes(10));

        // 1. Update IoT Device last seen
        $device->update([
            'status' => 'online',
            'last_seen_at' => $now,
        ]);

        $processedSlots = [];
        $arrivalEvents = [];

        foreach ($slotsData as $slotItem) {
            $slotCode = $slotItem['slot_code'] ?? null;
            $sensorValue = $slotItem['sensor_value'] ?? null;
            $status = $slotItem['status'];

            if (!$slotCode) {
                continue;
            }

            $slot = ParkingSlot::where('slot_code', $slotCode)->first();
            if (!$slot) {
                continue;
            }

            $oldStatus = $slot->physical_status;

            // Update slot state
            $slot->update([
                'sensor_value' => $sensorValue,
                'physical_status' => $status,
                'last_detected_at' => $now,
            ]);

            // Save sensor log entry
            SensorLog::create([
                'parking_slot_id' => $slot->id,
                'sensor_value' => $sensorValue,
                'detected_status' => $status,
                'recorded_at' => $now,
            ]);

            // Arrival Trigger: If sensor detected a car (occupied) and slot was not occupied previously
            if ($status === 'occupied') {
                // Find matching reservation for this slot
                $matchingRes = Reservation::where('parking_slot_id', $slot->id)
                    ->where('status', 'confirmed')
                    ->whereHas('payments', function ($query) {
                        $query->where('status', 'approved');
                    })
                    ->where('start_time', '<=', $now->copy()->addMinutes(60))
                    ->where('end_time', '>=', $now->copy()->subMinutes(30))
                    ->latest()
                    ->first();

                if ($matchingRes) {
                    // Check if an existing pending verification exists within the last 5 minutes to avoid duplicate floods
                    $existingPending = ArrivalVerification::where('reservation_id', $matchingRes->id)
                        ->where('parking_slot_id', $slot->id)
                        ->where('status', 'pending')
                        ->where('detected_at', '>=', $now->copy()->subMinutes(5))
                        ->first();

                    if (!$existingPending) {
                        $verification = ArrivalVerification::create([
                            'reservation_id' => $matchingRes->id,
                            'parking_slot_id' => $slot->id,
                            'detected_at' => $now,
                            'status' => 'pending',
                            'notes' => "Kendaraan terdeteksi oleh sensor ESP32 ({$deviceCode}) pada slot {$slotCode}.",
                        ]);

                        $arrivalEvents[] = [
                            'verification_id' => $verification->id,
                            'reservation_code' => $matchingRes->reservation_code,
                            'slot_code' => $slotCode,
                            'vehicle_plate' => $matchingRes->vehicle_plate,
                        ];
                    }
                }
            }

            $processedSlots[] = [
                'slot_code' => $slotCode,
                'status' => $status,
                'sensor_value' => $sensorValue,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Status sensor berhasil diperbarui.',
            'data' => [
                'device_id' => $deviceCode,
                'processed_slots' => $processedSlots,
                'arrival_events' => $arrivalEvents,
                'timestamp' => $now->toIso8601String(),
            ],
        ]);
    }

    /**
     * ESP32 Heartbeat (FR-PARK-004)
     */
    public function deviceHeartbeat(Request $request): JsonResponse
    {
        $device = $request->attributes->get('iot_device');
        $deviceCode = $device->device_code;
        $now = now();

        $device->update([
            'status' => 'online',
            'last_seen_at' => $now,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat diterima.',
            'server_time' => $now->toIso8601String(),
            'device_status' => 'online',
        ]);
    }

    /**
     * Get slots status for ESP32
     */
    public function getSlots(): JsonResponse
    {
        $slots = ParkingSlot::orderBy('slot_code')->get(['id', 'slot_code', 'physical_status', 'sensor_value']);

        return response()->json([
            'success' => true,
            'slots' => $slots,
        ]);
    }
}
