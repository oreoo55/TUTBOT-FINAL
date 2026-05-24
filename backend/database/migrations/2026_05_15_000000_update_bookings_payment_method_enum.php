<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN payment_method ENUM('card', 'mobile', 'qr', 'cash', 'vodafone', 'instapay') NOT NULL DEFAULT 'cash'");
        }

        if (!Schema::hasColumn('bookings', 'receipt_path')) {
            Schema::table('bookings', function ($table) {
                $table->string('receipt_path', 255)->nullable()->after('payment_method');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN payment_method ENUM('card', 'mobile', 'qr', 'cash') NOT NULL DEFAULT 'cash'");
        }

        if (Schema::hasColumn('bookings', 'receipt_path')) {
            Schema::table('bookings', function ($table) {
                $table->dropColumn('receipt_path');
            });
        }
    }
};
