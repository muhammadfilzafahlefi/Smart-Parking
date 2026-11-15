<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ParkingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSessionController extends Controller
{
    /**
     * List parking sessions
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = ParkingSession::with([
            'reservation.user:id,name,phone',
            'reservation.parkingSlot:id,slot_code',
        ])->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $sessions = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }
}

