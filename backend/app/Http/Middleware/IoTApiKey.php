<?php

namespace App\Http\Middleware;

use App\Models\IotDevice;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class IoTApiKey
{
    /**
     * Handle an incoming request from ESP32 / IoT device.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-KEY');
        $deviceCode = $request->header('X-DEVICE-CODE')
            ?? $request->input('device_code')
            ?? $request->input('device_id');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API Key wajib disertakan (header X-API-KEY).',
            ], 401);
        }

        $device = $deviceCode
            ? IotDevice::where('device_code', $deviceCode)->first()
            : null;

        if (!$device || !Hash::check($apiKey, $device->api_key_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'API Key atau Device Code tidak valid.',
            ], 403);
        }

        // Attach device to request
        $request->attributes->set('iot_device', $device);

        return $next($request);
    }
}
