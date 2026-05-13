<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar', 500)->nullable()->after('remember_token');
            $table->unsignedInteger('level')->default(1)->after('avatar');
            $table->unsignedInteger('xp')->default(0)->after('level');
            $table->unsignedInteger('next_level_xp')->default(100)->after('xp');
            $table->string('location', 120)->nullable()->after('next_level_xp');
            $table->text('bio')->nullable()->after('location');
            $table->index('level', 'idx_users_level');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_level');
            $table->dropColumn(['avatar', 'level', 'xp', 'next_level_xp', 'location', 'bio']);
        });
    }
};
