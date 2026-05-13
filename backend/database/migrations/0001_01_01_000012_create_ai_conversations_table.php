<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 200)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('user_id', 'idx_ai_conv_user');
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('conversation_id');
            $table->enum('role', ['user', 'assistant', 'system', 'tool']);
            $table->mediumText('content');
            $table->json('tool_calls')->nullable();
            $table->unsignedInteger('tokens')->nullable();
            $table->timestamps();

            $table->index('conversation_id', 'idx_ai_msg_conv');
            $table->foreign('conversation_id')->references('id')->on('ai_conversations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
    }
};
