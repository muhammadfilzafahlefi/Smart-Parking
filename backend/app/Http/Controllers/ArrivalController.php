<?php

namespace App\Http\Controllers;

use App\Models\ArrivalVerification;
use App\Models\ParkingSession;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArrivalController extends Controller
{
    /**
     * Get pending arrival events for the logged-in user (FR-ARR-003)
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        // Find pending verifications belonging to the user's active/confirmed reservations
        $pendingVerifications = ArrivalVerification::with(['parkingSlot', 'reservation'])
            ->whereHas('reservation', function ($query) use ($user) {
                $query->where('status', 'confirmed')
                    ->whereHas('payments', function ($paymentQuery) {
                        $paymentQuery->where('status', 'approved');
                    });
                if (!$user->isAdmin()) {
                    $query->where('user_id', $user->id);
                }
            })
            ->where('status', 'pending')
            ->where('detected_at', '>=', now()->subMinutes(15)) // only recent sensor triggers
            ->latest('detected_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pendingVerifications,
        ]);
    }

    /**
     * User confirms arrival (FR-ARR-004, FR-ARR-005)
     */
    public function confirm(Request $request, $verificationId): JsonResponse
    {
        $user = $request->user();

        $verification = ArrivalVerification::with(['reservation', 'parkingSlot'])->find($verificationId);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Data deteksi kedatangan tidak ditemukan.',
            ], 404);
        }

        $reservation = $verification->reservation;

        if (!$reservation || (!$user->isAdmin() && $reservation->user_id !== $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Otorisasi gagal. Anda bukan pemilik reservasi ini.',
            ], 403);
        }

        if ($verification->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Verifikasi ini sudah berstatus: {$verification->status}.",
            ], 422);
        }

        if ($reservation->status !== 'confirmed' ||
            !$reservation->payments()->where('status', 'approved')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Check-in hanya dapat dilakukan setelah pembayaran disetujui.',
            ], 422);
        }
        if (!$verification->parkingSlot || $verification->parkingSlot->physical_status !== 'occupied') {
            return response()->json([
                'success' => false,
                'message' => 'Sensor tidak lagi mendeteksi kendaraan pada slot tersebut.',
            ], 422);
        }

        // Process confirmation inside transaction and lock both records against duplicate check-ins.
        $session = DB::transaction(function () use ($verification, $reservation, $user) {
            $now = now();
            $lockedVerification = ArrivalVerification::query()->lockForUpdate()->findOrFail($verification->id);
            $lockedReservation = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);

            if ($lockedVerification->status !== 'pending' || $lockedReservation->status !== 'confirmed') {
                abort(422, 'Reservasi atau verifikasi kedatangan sudah berubah.');
            }

            if (!$lockedReservation->payments()->where('status', 'approved')->exists()) {
                abort(422, 'Check-in hanya dapat dilakukan setelah pembayaran disetujui.');
            }
            if ($lockedVerification->parkingSlot()->where('physical_status', 'occupied')->doesntExist()) {
                abort(422, 'Sensor tidak lagi mendeteksi kendaraan pada slot tersebut.');
            }

            // 1. Update verification record
            $lockedVerification->update([
                'status' => 'verified',
                'confirmed_by' => $user->id,
                'confirmed_at' => $now,
                'notes' => 'Konfirmasi kedatangan berhasil diverifikasi oleh pemilik akun.',
            ]);

            // 2. Update reservation
            $lockedReservation->update([
                'status' => 'active',
                'arrival_confirmed_at' => $now,
            ]);

            // 3. Create or update Parking Session
            $session = ParkingSession::updateOrCreate(
                ['reservation_id' => $lockedReservation->id],
                [
                    'check_in' => $now,
                    'status' => 'active',
                ]
            );

            return $session;
        });

        return response()->json([
            'success' => true,
            'message' => 'Kedatangan kendaraan berhasil dikonfirmasi. Sesi parkir kini aktif!',
            'data' => [
                'verification' => $verification->fresh(),
                'reservation' => $reservation->fresh(),
                'parking_session' => $session,
            ],
        ]);
    }

    /**
     * User rejects arrival ("Bukan Saya")
     */
    public function reject(Request $request, $verificationId): JsonResponse
    {
        $user = $request->user();

        $verification = ArrivalVerification::with('reservation')->find($verificationId);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Data deteksi tidak ditemukan.',
            ], 404);
        }

        if ($verification->reservation && $verification->reservation->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda bukan pemilik reservasi ini.',
            ], 403);
        }

        if ($verification->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Verifikasi ini sudah berstatus: {$verification->status}.",
            ], 422);
        }

        $verification->update([
            'status' => 'failed',
            'confirmed_by' => $user->id,
            'confirmed_at' => now(),
            'notes' => 'Pengguna menyatakan bahwa bukan kendaraannya yang masuk ke slot.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan penolakan kedatangan berhasil dicatat.',
            'data' => $verification,
        ]);
    }

    /**
     * Check out vehicle from parking slot
     */
    public function checkout(Request $request, $reservationId): JsonResponse
    {
        $user = $request->user();

        $reservation = Reservation::with('parkingSession')->find($reservationId);

        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan.',
            ], 404);
        }

        if (!$user->isAdmin() && $reservation->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $session = $reservation->parkingSession;
        if (!$session || $session->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada sesi parkir aktif untuk reservasi ini.',
            ], 422);
        }

        [$session, $reservation] = DB::transaction(function () use ($reservation) {
            $lockedReservation = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            $lockedSession = ParkingSession::query()
                ->where('reservation_id', $lockedReservation->id)
                ->lockForUpdate()
                ->first();
            if (!$lockedSession || $lockedSession->status !== 'active') {
                abort(422, 'Tidak ada sesi parkir aktif untuk reservasi ini.');
            }

            $lockedSession->update([
                'check_out' => now(),
                'status' => 'completed',
            ]);
            $lockedReservation->update(['status' => 'completed']);

            return [$lockedSession, $lockedReservation];
        });

        return response()->json([
            'success' => true,
            'message' => 'Sesi parkir berhasil diselesaikan (Check-Out berhasil).',
            'data' => [
                'session' => $session,
                'reservation' => $reservation,
            ],
        ]);
    }
}
