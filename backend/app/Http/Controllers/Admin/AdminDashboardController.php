<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IotDevice;
use App\Models\ParkingSession;
use App\Models\ParkingSlot;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * Admin dashboard summary metrics (FR-REP-001, FR-PARK-004)
     */
    public function stats(): JsonResponse
    {
        $now = now();
        $todayStart = $now->copy()->startOfDay();
        $monthStart = $now->copy()->startOfMonth();
        $yearStart = $now->copy()->startOfYear();

        // 1. Revenue calculations based strictly on verified_at of approved payments (FR-PAY-005, FR-REP-001)
        $revenueTotal = Payment::where('status', 'approved')->sum('amount');
        $revenueToday = Payment::where('status', 'approved')
            ->where('verified_at', '>=', $todayStart)
            ->sum('amount');
        $revenueMonth = Payment::where('status', 'approved')
            ->where('verified_at', '>=', $monthStart)
            ->sum('amount');
        $revenueYear = Payment::where('status', 'approved')
            ->where('verified_at', '>=', $yearStart)
            ->sum('amount');

        // 2. Count metrics
        $totalUsers = User::where('role', 'user')->count();
        $totalReservations = Reservation::count();
        $pendingPaymentsCount = Payment::where('status', 'pending')->count();
        $activeSessionsCount = ParkingSession::where('status', 'active')->count();

        // 3. Slot states
        $slots = ParkingSlot::orderBy('slot_code')->get();
        $occupiedSlots = $slots->where('physical_status', 'occupied')->count();
        $emptySlots = $slots->where('physical_status', 'empty')->count();

        // 4. ESP32 Heartbeat status
        $device = IotDevice::where('device_code', 'ESP32_PARKING_01')->first();
        $isDeviceOnline = false;
        if ($device && $device->last_seen_at) {
            $isDeviceOnline = $device->last_seen_at->diffInSeconds($now) <= 60;
        }

        // 5. Recent lists
        $recentReservations = Reservation::with(['user:id,name', 'parkingSlot:id,slot_code'])
            ->latest()
            ->limit(5)
            ->get();

        $recentPayments = Payment::with(['reservation.user:id,name', 'reservation.parkingSlot:id,slot_code'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'metrics' => [
                    'total_users' => $totalUsers,
                    'total_reservations' => $totalReservations,
                    'pending_payments' => $pendingPaymentsCount,
                    'active_sessions' => $activeSessionsCount,
                    'total_revenue' => (float)$revenueTotal,
                    'today_revenue' => (float)$revenueToday,
                    'month_revenue' => (float)$revenueMonth,
                    'year_revenue' => (float)$revenueYear,
                ],
                'parking_slots' => [
                    'total' => $slots->count(),
                    'occupied' => $occupiedSlots,
                    'empty' => $emptySlots,
                    'items' => $slots,
                ],
                'esp32' => [
                    'device_code' => $device ? $device->device_code : 'ESP32_PARKING_01',
                    'status' => $isDeviceOnline ? 'online' : 'offline',
                    'last_seen_at' => $device && $device->last_seen_at ? $device->last_seen_at->toIso8601String() : null,
                ],
                'recent_reservations' => $recentReservations,
                'recent_payments' => $recentPayments,
            ],
        ]);
    }
}

