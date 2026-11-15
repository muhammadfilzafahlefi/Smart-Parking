<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    /**
     * Get payment settings and bank accounts (FR-PAY-001)
     */
    public function getBankInfo(): JsonResponse
    {
        $bankAccounts = $this->configuredBankAccounts();

        return response()->json([
            'success' => true,
            'data' => [
                'payment_enabled' => count($bankAccounts) > 0,
                'bank_accounts' => $bankAccounts,
                'instructions' => [
                    'Transfer sesuai nominal yang tertera pada reservasi Anda.',
                    'Simpan bukti transfer berupa foto atau screenshot (struk ATM / m-Banking).',
                    'Upload bukti transfer melalui form pembayaran.',
                    'Admin akan memverifikasi pembayaran Anda dalam 1-5 menit.',
                ],
            ],
        ]);
    }

    /**
     * Upload payment proof (FR-PAY-002)
     */
    public function uploadProof(Request $request, $reservationId): JsonResponse
    {
        if (count($this->configuredBankAccounts()) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran belum tersedia. Rekening penerima belum dikonfigurasi.',
            ], 503);
        }

        $request->validate([
            'proof_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // max 5MB
        ]);

        $user = $request->user();
        $reservation = Reservation::find($reservationId);

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

        if (in_array($reservation->status, ['confirmed', 'active', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi ini sudah terkonfirmasi atau selesai dibayar.',
            ], 422);
        }

        // Keep proof images private; admins retrieve them through the authenticated proof endpoint.
        $file = $request->file('proof_image');
        $fileName = 'payment_' . $reservation->reservation_code . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('payments', $fileName, 'local');

        // Create or update payment record
        $payment = Payment::updateOrCreate(
            [
                'reservation_id' => $reservation->id,
                'status' => 'unpaid',
            ],
            [
                'amount' => $reservation->total_price,
                'payment_method' => 'bank_transfer',
                'proof_image' => $path,
                'status' => 'pending',
                'rejection_reason' => null,
            ]
        );

        // Update reservation status to waiting_verification
        $reservation->update([
            'status' => 'waiting_verification',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.',
            'data' => [
                'payment' => $payment,
                'reservation' => $reservation->fresh(),
            ],
        ]);
    }

    /**
     * Get payment status for a reservation
     */
    public function show(Request $request, $reservationId): JsonResponse
    {
        $user = $request->user();
        $reservation = Reservation::with(['payments.verifiedBy:id,name'])->find($reservationId);

        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan.',
            ], 404);
        }

        if (!$user->isAdmin() && $reservation->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'reservation_code' => $reservation->reservation_code,
                'reservation_status' => $reservation->status,
                'total_price' => $reservation->total_price,
                'payments' => $reservation->payments,
            ],
        ]);
    }

    private function configuredBankAccounts(): array
    {
        $accountName = trim((string) config('smartparking.bank_account_name'));
        if ($accountName === '') {
            return [];
        }

        return array_values(array_map(
            static fn (array $account): array => [
                ...$account,
                'account_name' => $accountName,
            ],
            array_filter(
                config('smartparking.bank_accounts', []),
                static fn (array $account): bool => trim((string) ($account['account_number'] ?? '')) !== ''
            )
        ));
    }
}
