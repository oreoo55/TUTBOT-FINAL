<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_versions', function (Blueprint $table) {
            $table->string('content_type', 50)->primary();
            $table->timestamp('updated_at')->useCurrent();
        });

        DB::table('content_versions')->insert([
            ['content_type' => 'landmarks', 'updated_at' => now()],
            ['content_type' => 'posts', 'updated_at' => now()],
            ['content_type' => 'reviews', 'updated_at' => now()],
            ['content_type' => 'bookings', 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('content_versions');
    }
};
