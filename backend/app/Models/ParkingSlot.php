<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParkingSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'slot_code',
        'sensor_channel',
        'sensor_value',
        'physical_status',
        'last_detected_at',
    ];

    protected function casts(): array
    {
        return [
            'sensor_value' => 'integer',
            'last_detected_at' => 'datetime',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(IotDevice::class, 'device_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function sensorLogs(): HasMany
    {
        return $this->hasMany(SensorLog::class);
    }

    public function arrivalVerifications(): HasMany
    {
        return $this->hasMany(ArrivalVerification::class);
    }
}

