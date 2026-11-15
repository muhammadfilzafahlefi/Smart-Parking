<?php

namespace Database\Seeders;

use App\Models\IotDevice;
use App\Models\ParkingSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminPassword = config('smartparking.admin_password');
        $userPassword = config('smartparking.user_password');
        $deviceApiKey = config('smartparking.iot_api_key');
        if (!$adminPassword || strlen($adminPassword) < 12 ||
            !$userPassword || strlen($userPassword) < 12 ||
            !$deviceApiKey || strlen($deviceApiKey) < 32) {
            throw new \RuntimeException(
                'Set SMART_PARKING_ADMIN_PASSWORD and SMART_PARKING_USER_PASSWORD (at least 12 characters), ' .
                'and IOT_DEVICE_API_KEY (at least 32 characters) before seeding.'
            );
        }

        User::firstOrCreate(
            ['email' => config('smartparking.admin_email')],
            [
                'name' => 'Administrator Smart Parking',
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => config('smartparking.user_email')],
            [
                'name' => 'Pengguna Parkir',
                'password' => Hash::make($userPassword),
                'role' => 'user',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $device = IotDevice::updateOrCreate(
            ['device_code' => 'ESP32_PARKING_01'],
            [
                'device_name' => 'ESP32 Gate Controller Node 1',
                'api_key_hash' => Hash::make($deviceApiKey),
            ]
        );

        $slots = [
            ['code' => 'A01', 'channel' => 'CH_1'],
            ['code' => 'A02', 'channel' => 'CH_2'],
            ['code' => 'A03', 'channel' => 'CH_3'],
            ['code' => 'A04', 'channel' => 'CH_4'],
        ];

        foreach ($slots as $slot) {
            ParkingSlot::firstOrCreate(
                ['slot_code' => $slot['code']],
                [
                    'device_id' => $device->id,
                    'sensor_channel' => $slot['channel'],
                    'sensor_value' => null,
                    'physical_status' => 'unknown',
                    'last_detected_at' => null,
                ]
            );
        }
    }
}
