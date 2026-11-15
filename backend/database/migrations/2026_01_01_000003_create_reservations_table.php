<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_code', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('parking_slot_id')->constrained('parking_slots')->restrictOnDelete();
            $table->string('vehicle_plate', 20);
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->decimal('total_price', 12, 2);
            $table->string('status', 30)->default('pending_payment'); // pending_payment, waiting_verification, confirmed, active, completed, rejected, cancelled, expired
            $table->dateTime('arrival_confirmed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['parking_slot_id', 'start_time', 'end_time']);
            $table->index(['status', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};

