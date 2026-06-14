<?php

namespace App\Http\Controllers;

use App\Models\ContentVersion;
use App\Models\Notification;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostLikeController extends Controller
{
    public function toggle(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail((int) $id);
        $userId = $request->user()->id;

        if ($post->isLikedByUser($userId)) {
            $post->likes()->where('user_id', $userId)->delete();
            $post->decrement('likes_count');
            $liked = false;
        } else {
            $post->likes()->create(['user_id' => $userId]);
            $post->increment('likes_count');
            $liked = true;

            if ($post->user_id !== $userId) {
                Notification::create([
                    'user_id' => $post->user_id,
                    'type' => 'like',
                    'data' => [
                        'actor_name' => $request->user()->name,
                        'actor_id' => (string) $userId,
                        'post_id' => (string) $post->id,
                        'post_excerpt' => mb_substr($post->text, 0, 100),
                    ],
                ]);
            }
        }

        ContentVersion::bump('posts');

        return response()->json([
            'likes' => $post->fresh()->likes_count,
            'liked_by_me' => $liked,
        ]);
    }
}
