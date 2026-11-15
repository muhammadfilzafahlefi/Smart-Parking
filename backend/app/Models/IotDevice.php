<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IotDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_code',
        'device_name',
        'api_key_hash',
        'status',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
        ];
    }

    public function parkingSlots(): HasMany
    {
        return $this->hasMany(ParkingSlot::class, 'device_id');
    }
}

