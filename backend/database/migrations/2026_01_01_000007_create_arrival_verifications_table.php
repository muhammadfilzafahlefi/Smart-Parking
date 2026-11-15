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
        Schema::create('arrival_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->restrictOnDelete();
            $table->foreignId('parking_slot_id')->constrained('parking_slots')->restrictOnDelete();
            $table->dateTime('detected_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('confirmed_at')->nullable();
            $table->string('status', 20)->default('pending'); // pending, verified, failed, expired
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['reservation_id', 'created_at']);
            $table->index(['parking_slot_id', 'detected_at']);
            $table->index('confirmed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arrival_verifications');
    }
};

