<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SensorLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'parking_slot_id',
        'sensor_value',
        'detected_status',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'sensor_value' => 'integer',
            'recorded_at' => 'datetime',
        ];
    }

    public function parkingSlot(): BelongsTo
    {
        return $this->belongsTo(ParkingSlot::class);
    }
}

