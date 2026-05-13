<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('landmark_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('text');
            $table->timestamps();
            $table->unique(['user_id', 'landmark_id'], 'uniq_review_user_landmark');
            $table->index('landmark_id', 'idx_reviews_landmark');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
