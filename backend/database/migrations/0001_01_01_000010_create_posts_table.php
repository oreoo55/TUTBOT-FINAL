<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('landmark_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('category', ['Archaeological', 'Museum', 'Religious', 'Recreational', 'Cultural', 'General'])->default('General');
            $table->text('text');
            $table->string('image', 500)->nullable();
            $table->string('video_url', 500)->nullable();
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->timestamps();

            $table->index('user_id', 'idx_posts_user');
            $table->index('landmark_id', 'idx_posts_landmark');
            $table->index('created_at', 'idx_posts_created');
        });

        Schema::create('post_likes', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['post_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_likes');
        Schema::dropIfExists('posts');
    }
};
