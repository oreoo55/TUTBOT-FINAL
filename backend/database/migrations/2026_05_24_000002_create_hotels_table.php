<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address');
            $table->string('category'); // Hotel, Resort, Boutique, etc.
            $table->string('star_rating', 10)->nullable(); // 3*, 4*, 5*
            $table->string('price_level', 10)->nullable(); // $, $$, $$$
            $table->decimal('rating', 3, 1)->default(0);
            $table->string('region');
            $table->string('neighborhood')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->text('google_maps_url')->nullable();
            $table->string('image')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('amenities')->nullable(); // comma-separated
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};
