<?php

return [
    'tariff_per_hour' => (int) env('PARKING_TARIFF_PER_HOUR', 5000),
    'iot_api_key' => env('IOT_DEVICE_API_KEY'),
    'admin_email' => env('SMART_PARKING_ADMIN_EMAIL', 'admin@smartparking.id'),
    'admin_password' => env('SMART_PARKING_ADMIN_PASSWORD'),
    'user_email' => env('SMART_PARKING_USER_EMAIL', 'user@smartparking.com'),
    'user_password' => env('SMART_PARKING_USER_PASSWORD'),
    'bank_account_name' => env('SMART_PARKING_BANK_ACCOUNT_NAME'),
    'bank_accounts' => [
        ['bank_name' => 'BCA', 'account_number' => env('SMART_PARKING_BCA_ACCOUNT_NUMBER')],
        ['bank_name' => 'Mandiri', 'account_number' => env('SMART_PARKING_MANDIRI_ACCOUNT_NUMBER')],
        ['bank_name' => 'BRI', 'account_number' => env('SMART_PARKING_BRI_ACCOUNT_NUMBER')],
    ],
];
