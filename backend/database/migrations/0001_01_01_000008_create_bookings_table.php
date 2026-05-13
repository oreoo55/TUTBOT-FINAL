<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('landmark_id')->constrained()->restrictOnDelete();
            $table->date('booking_date');
            $table->unsignedTinyInteger('adults')->default(1);
            $table->unsignedTinyInteger('children')->default(0);
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('service_fee')->default(0);
            $table->unsignedInteger('total');
            $table->char('currency', 3)->default('EGP');
            $table->enum('payment_method', ['card', 'mobile', 'qr', 'cash']);
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->enum('status', ['confirmed', 'cancelled', 'completed', 'no_show'])->default('confirmed');
            $table->char('confirmation_code', 6)->unique();
            $table->string('qr_token', 64)->unique();
            $table->string('payer_name', 120);
            $table->string('payer_email', 190);
            $table->string('payer_phone', 40)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index('user_id', 'idx_bookings_user');
            $table->index('booking_date', 'idx_bookings_date');
            $table->index('status', 'idx_bookings_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
