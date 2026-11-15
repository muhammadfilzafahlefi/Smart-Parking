<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminPaymentController extends Controller
{
    public function proof($id): BinaryFileResponse|JsonResponse
    {
        $payment = Payment::find($id);
        if (!$payment || !$payment->proof_image || !Storage::disk('local')->exists($payment->proof_image)) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti pembayaran tidak ditemukan.',
            ], 404);
        }

        return response()->file(Storage::disk('local')->path($payment->proof_image));
    }

    /**
     * List payments with filtering (status, search)
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $query = Payment::with(['reservation.user', 'reservation.parkingSlot', 'verifiedBy:id,name'])
            ->orderBy('created_at', 'desc');

        if ($status && in_array($status, ['unpaid', 'pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        $payments = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Approve payment (FR-PAY-003, FR-PAY-004)
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $admin = $request->user();
        $payment = Payment::with('reservation')->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembayaran tidak ditemukan.',
            ], 404);
        }

        if ($payment->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran ini sudah pernah disetujui sebelumnya.',
            ], 422);
        }

        DB::transaction(function () use ($payment, $admin) {
            $now = now();

            // 1. Update payment to approved
            $payment->update([
                'status' => 'approved',
                'verified_by' => $admin->id,
                'verified_at' => $now,
                'rejection_reason' => null,
            ]);

            // 2. Update reservation to confirmed (ready for arrival)
            if ($payment->reservation) {
                $payment->reservation->update([
                    'status' => 'confirmed',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil disetujui. Reservasi kini aktif dan terkonfirmasi.',
            'data' => $payment->fresh(['reservation', 'verifiedBy']),
        ]);
    }

    /**
     * Reject payment with reason (FR-PAY-003, FR-PAY-004)
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $admin = $request->user();
        $payment = Payment::with('reservation')->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembayaran tidak ditemukan.',
            ], 404);
        }

        if ($payment->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran yang sudah disetujui tidak dapat ditolak.',
            ], 422);
        }

        DB::transaction(function () use ($payment, $admin, $request) {
            $now = now();

            // 1. Update payment to rejected
            $payment->update([
                'status' => 'rejected',
                'verified_by' => $admin->id,
                'verified_at' => $now,
                'rejection_reason' => $request->input('rejection_reason'),
            ]);

            // 2. Update reservation to rejected
            if ($payment->reservation) {
                $payment->reservation->update([
                    'status' => 'rejected',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil ditolak dengan alasan yang tercatat.',
            'data' => $payment->fresh(['reservation', 'verifiedBy']),
        ]);
    }
}
