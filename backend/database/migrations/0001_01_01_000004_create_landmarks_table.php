<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landmarks', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('region', 120);
            $table->string('city', 120)->nullable();
            $table->string('area', 120)->nullable();
            $table->enum('category', ['Archaeological', 'Museum', 'Religious', 'Recreational', 'Cultural']);
            $table->string('raw_category', 60);
            $table->string('era', 60)->nullable();
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();
            $table->string('fallback_image', 500)->nullable();
            $table->string('panorama_url', 500)->nullable();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->unsignedInteger('price')->default(0);
            $table->string('opening_hours', 20)->nullable();
            $table->string('closing_hours', 20)->nullable();
            $table->unsignedSmallInteger('avg_visit_duration')->nullable();
            $table->boolean('accessibility_wheelchair')->default(false);
            $table->boolean('is_outdoor')->default(false);
            $table->string('best_day_visit', 20)->nullable();
            $table->string('best_season', 20)->nullable();
            $table->string('cost_level', 20)->nullable();
            $table->unsignedInteger('entrance_fee_egyptian')->default(0);
            $table->unsignedInteger('entrance_fee_egyptian_student')->default(0);
            $table->unsignedInteger('entrance_fee_foreigner')->default(0);
            $table->unsignedInteger('entrance_fee_foreigner_student')->default(0);
            $table->timestamps();

            $table->index('region', 'idx_landmarks_region');
            $table->index('category', 'idx_landmarks_category');
            $table->index('rating', 'idx_landmarks_rating');
            $table->fullText(['name', 'description'], 'ftx_landmarks_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landmarks');
    }
};
