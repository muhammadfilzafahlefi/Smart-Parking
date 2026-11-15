<?php

namespace App\Http\Controllers;

use App\Models\ParkingSlot;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParkingSlotController extends Controller
{
    /**
     * Get all parking slots with their physical and reservation status (FR-PARK-001, FR-PARK-003, FR-RES-001)
     */
    public function index(): JsonResponse
    {
        $now = now();
        $slots = ParkingSlot::with(['device'])->orderBy('slot_code')->get();

        $data = $slots->map(function ($slot) use ($now) {
            // Public consumers may see availability, never reservation or vehicle identity.
            $isReserved = Reservation::query()
                ->where('parking_slot_id', $slot->id)
                ->whereIn('status', ['pending_payment', 'waiting_verification', 'confirmed', 'active'])
                ->where('start_time', '<=', $now->copy()->addHours(2)) // relevant active window
                ->where('end_time', '>=', $now)
                ->exists();

            return [
                'id' => $slot->id,
                'slot_code' => $slot->slot_code,
                'sensor_channel' => $slot->sensor_channel,
                'sensor_value' => $slot->sensor_value,
                'physical_status' => $slot->physical_status, // 'empty', 'occupied', 'unknown'
                'last_detected_at' => $slot->last_detected_at ? $slot->last_detected_at->toIso8601String() : null,
                'is_reserved' => $isReserved,
            ];
        });

        // Summary counts
        $totalSlots = $data->count();
        $occupiedCount = $data->where('physical_status', 'occupied')->count();
        $emptyCount = $data->where('physical_status', 'empty')->count();
        $reservedCount = $data->where('is_reserved', true)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'slots' => $data,
                'summary' => [
                    'total' => $totalSlots,
                    'occupied' => $occupiedCount,
                    'empty' => $emptyCount,
                    'reserved' => $reservedCount,
                    'available' => max(0, $totalSlots - $occupiedCount - $reservedCount),
                ],
                'updated_at' => $now->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get single slot detail
     */
    public function show($id): JsonResponse
    {
        $slot = ParkingSlot::find($id);

        if (!$slot) {
            return response()->json([
                'success' => false,
                'message' => 'Slot parkir tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $slot->id,
                'slot_code' => $slot->slot_code,
                'sensor_channel' => $slot->sensor_channel,
                'sensor_value' => $slot->sensor_value,
                'physical_status' => $slot->physical_status,
                'last_detected_at' => $slot->last_detected_at?->toIso8601String(),
            ],
        ]);
    }
}
