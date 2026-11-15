<?php

namespace App\Http\Controllers;

use App\Models\ParkingSlot;
use App\Models\Payment;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationController extends Controller
{
    /**
     * List user reservations (or all for admin)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Reservation::with(['parkingSlot', 'payments', 'parkingSession'])
            ->orderBy('created_at', 'desc');

        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $reservations = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $reservations,
        ]);
    }

    /**
     * Create new reservation with double booking prevention (FR-RES-002, FR-RES-005)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parking_slot_id' => 'required|exists:parking_slots,id',
            'vehicle_plate' => 'required|string|max:20',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $user = $request->user();
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);

        // Pricing is derived from server configuration; client-submitted totals are ignored.
        $durationHours = max(1, ceil($startTime->diffInMinutes($endTime) / 60));
        $totalPrice = $durationHours * (int) config('smartparking.tariff_per_hour', 5000);

        // Normalize plate number: uppercase without excessive spaces
        $vehiclePlate = strtoupper(trim(preg_replace('/\s+/', ' ', $validated['vehicle_plate'])));

        // Use database transaction and pessimistic locking to prevent double booking
        $reservation = DB::transaction(function () use ($user, $validated, $startTime, $endTime, $totalPrice, $vehiclePlate) {
            // Lock slot record
            $slot = ParkingSlot::lockForUpdate()->find($validated['parking_slot_id']);

            // Conflict check: existing overlapping reservations that are not cancelled/rejected/expired
            $conflict = Reservation::where('parking_slot_id', $slot->id)
                ->whereIn('status', ['pending_payment', 'waiting_verification', 'confirmed', 'active'])
                ->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->lockForUpdate()
                ->first();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'parking_slot_id' => [
                        "Slot {$slot->slot_code} sudah dipesan oleh kendaraan lain pada rentang waktu tersebut ({$conflict->start_time->format('H:i')} - {$conflict->end_time->format('H:i')}). Silakan pilih slot atau waktu lain."
                    ],
                ]);
            }

            // Generate unique reservation code: RSV-YYYYMMDD-XXXX
            $datePrefix = 'RSV-' . now()->format('Ymd') . '-';
            $todayCount = Reservation::where('reservation_code', 'LIKE', $datePrefix . '%')->count() + 1;
            $reservationCode = $datePrefix . str_pad($todayCount, 4, '0', STR_PAD_LEFT);

            // Create reservation
            $newRes = Reservation::create([
                'reservation_code' => $reservationCode,
                'user_id' => $user->id,
                'parking_slot_id' => $slot->id,
                'vehicle_plate' => $vehiclePlate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'total_price' => $totalPrice,
                'status' => 'pending_payment',
            ]);

            // Create initial payment record
            Payment::create([
                'reservation_id' => $newRes->id,
                'amount' => $totalPrice,
                'payment_method' => 'bank_transfer',
                'status' => 'unpaid',
            ]);

            return $newRes->load(['parkingSlot', 'payments']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dibuat. Silakan lakukan pembayaran.',
            'data' => $reservation,
        ], 201);
    }

    /**
     * Show reservation detail
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $reservation = Reservation::with(['parkingSlot', 'payments', 'parkingSession', 'user:id,name,email,phone'])
            ->find($id);

        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan.',
            ], 404);
        }

        if (!$user->isAdmin() && $reservation->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk reservasi ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $reservation,
        ]);
    }

    /**
     * Cancel reservation
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan.',
            ], 404);
        }

        if (!$user->isAdmin() && $reservation->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk membatalkan reservasi ini.',
            ], 403);
        }

        if (in_array($reservation->status, ['active', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi yang sedang aktif atau sudah selesai tidak dapat dibatalkan.',
            ], 422);
        }

        $reservation->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dibatalkan.',
            'data' => $reservation,
        ]);
    }
}
