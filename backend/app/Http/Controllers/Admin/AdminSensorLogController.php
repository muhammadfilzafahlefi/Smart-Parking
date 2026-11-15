<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SensorLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSensorLogController extends Controller
{
    /**
     * List sensor logs (FR-PARK-005)
     */
    public function index(Request $request): JsonResponse
    {
        $slotCode = $request->query('slot_code');
        $status = $request->query('status');

        $query = SensorLog::with('parkingSlot:id,slot_code')
            ->orderBy('recorded_at', 'desc');

        if ($slotCode) {
            $query->whereHas('parkingSlot', function ($q) use ($slotCode) {
                $q->where('slot_code', $slotCode);
            });
        }

        if ($status) {
            $query->where('detected_status', $status);
        }

        $logs = $query->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}

