<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminReservationController;
use App\Http\Controllers\Admin\AdminRevenueController;
use App\Http\Controllers\Admin\AdminSensorLogController;
use App\Http\Controllers\Admin\AdminSessionController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\ArrivalController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\IoT\IoTController;
use App\Http\Controllers\ParkingSlotController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Smart Parking System
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PUBLIC AUTHENTICATION & INFORMATION
// ==========================================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Public Slot Monitoring & Bank Info
Route::get('/parking-slots', [ParkingSlotController::class, 'index']);
Route::get('/parking-slots/{id}', [ParkingSlotController::class, 'show']);
Route::get('/payments/bank-info', [PaymentController::class, 'getBankInfo']);

// Central State Synchronization for Multi-device (Laptop, HP, etc.)
Route::get('/sync/store', [SyncController::class, 'getStore']);
Route::post('/sync/store', [SyncController::class, 'updateStore']);
Route::post('/sync/payment-proofs', [SyncController::class, 'uploadPaymentProof']);
Route::get('/sync/payment-proofs/{fileName}', [SyncController::class, 'showPaymentProof'])
    ->where('fileName', '[A-Za-z0-9.-]+');

// ==========================================
// 2. IOT DEVICE / ESP32 ENDPOINTS (API Key Protected)
// ==========================================
Route::prefix('iot')->middleware('iot.key')->group(function () {
    Route::post('/sensor-update', [IoTController::class, 'sensorUpdate']);
    Route::post('/device-heartbeat', [IoTController::class, 'deviceHeartbeat']);
    Route::get('/slots', [IoTController::class, 'getSlots']);
});

// (Middleware supports X-API-KEY header, body 'api_key', or Bearer token)

// ==========================================
// 3. AUTHENTICATED USER ROUTES
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // Auth user info & logout
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Reservations (User can view their own, Admin can view all)
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/{id}', [ReservationController::class, 'show']);
    Route::delete('/reservations/{id}', [ReservationController::class, 'cancel']);

    // Payments
    Route::post('/payments/{reservationId}/upload', [PaymentController::class, 'uploadProof']);
    Route::get('/payments/{reservationId}', [PaymentController::class, 'show']);

    // Arrival Verification & Parking Sessions
    Route::get('/arrival/pending', [ArrivalController::class, 'pending']);
    Route::post('/arrival/{verificationId}/confirm', [ArrivalController::class, 'confirm']);
    Route::post('/arrival/{verificationId}/reject', [ArrivalController::class, 'reject']);
    Route::post('/arrival/{reservationId}/checkout', [ArrivalController::class, 'checkout']);

    // ==========================================
    // 4. ADMIN ONLY ROUTES (auth:sanctum + admin)
    // ==========================================
    Route::prefix('admin')->middleware('admin')->group(function () {
        // Summary statistics
        Route::get('/stats', [AdminDashboardController::class, 'stats']);

        // Payment verifications
        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/{id}/proof', [AdminPaymentController::class, 'proof']);
        Route::post('/payments/{id}/approve', [AdminPaymentController::class, 'approve']);
        Route::post('/payments/{id}/reject', [AdminPaymentController::class, 'reject']);

        // Reservations management
        Route::get('/reservations', [AdminReservationController::class, 'index']);
        Route::get('/reservations/{id}', [AdminReservationController::class, 'show']);
        Route::put('/reservations/{id}/status', [AdminReservationController::class, 'updateStatus']);

        // User management
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

        // Revenue reports
        Route::get('/revenue/daily', [AdminRevenueController::class, 'daily']);
        Route::get('/revenue/monthly', [AdminRevenueController::class, 'monthly']);
        Route::get('/revenue/annual', [AdminRevenueController::class, 'annual']);

        // Telemetry & Sessions
        Route::get('/sensor-logs', [AdminSensorLogController::class, 'index']);
        Route::get('/sessions', [AdminSessionController::class, 'index']);
        Route::get('/arrival/pending', [ArrivalController::class, 'pending']);
    });
});
