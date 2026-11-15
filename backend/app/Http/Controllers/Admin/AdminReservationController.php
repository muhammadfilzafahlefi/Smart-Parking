<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReservationController extends Controller
{
    /**
     * List all reservations with search and filter
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $slotCode = $request->query('slot_code');
        $search = $request->query('search');

        $query = Reservation::with(['user', 'parkingSlot', 'payments', 'parkingSession'])
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($slotCode) {
            $query->whereHas('parkingSlot', function ($q) use ($slotCode) {
                $q->where('slot_code', $slotCode);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reservation_code', 'LIKE', "%{$search}%")
                  ->orWhere('vehicle_plate', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        $reservations = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reservations,
        ]);
    }

    /**
     * Show reservation detail
     */
    public function show($id): JsonResponse
    {
        $reservation = Reservation::with(['user', 'parkingSlot', 'payments.verifiedBy', 'parkingSession', 'arrivalVerifications'])
            ->find($id);

        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $reservation,
        ]);
    }

    /**
     * Admin manually update reservation status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending_payment,waiting_verification,confirmed,rejected,cancelled,expired',
        ]);

        $reservation = Reservation::find($id);
        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan.',
            ], 404);
        }

        if ($request->input('status') === 'confirmed' &&
            !$reservation->payments()->where('status', 'approved')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi hanya dapat dikonfirmasi setelah pembayaran disetujui.',
            ], 422);
        }

        $reservation->update([
            'status' => $request->input('status'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status reservasi berhasil diperbarui.',
            'data' => $reservation,
        ]);
    }
}
