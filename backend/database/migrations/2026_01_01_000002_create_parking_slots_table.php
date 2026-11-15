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
        Schema::create('parking_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained('iot_devices')->nullOnDelete();
            $table->string('slot_code', 10)->unique();
            $table->string('sensor_channel', 20)->nullable();
            $table->integer('sensor_value')->nullable();
            $table->string('physical_status', 20)->default('unknown'); // empty/occupied/unknown
            $table->dateTime('last_detected_at')->nullable();
            $table->timestamps();

            $table->index(['device_id', 'sensor_channel']);
            $table->index('physical_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parking_slots');
    }
};

