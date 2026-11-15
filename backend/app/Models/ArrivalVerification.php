<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArrivalVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'parking_slot_id',
        'detected_at',
        'confirmed_by',
        'confirmed_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'detected_at' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function parkingSlot(): BelongsTo
    {
        return $this->belongsTo(ParkingSlot::class);
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}

