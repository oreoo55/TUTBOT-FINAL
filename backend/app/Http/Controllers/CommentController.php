<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\ContentVersion;
use App\Models\Notification;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    public function index(string $postId): JsonResponse
    {
        $post = Post::findOrFail((int) $postId);

        $comments = $post->comments()->with('user', 'replies.user')->whereNull('parent_id')
            ->orderByDesc('created_at')->paginate(20);

        $comments->getCollection()->transform(fn($c) => $this->commentResponse($c));

        return response()->json($comments);
    }

    public function store(Request $request, string $postId): JsonResponse
    {
        $post = Post::findOrFail((int) $postId);

        $validated = $request->validate([
            'text' => 'required|string|max:2000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'text' => $validated['text'],
            'is_ai' => false,
        ]);

        $post->increment('comments_count');

        $comment->load('user');

        $actorId = $request->user()->id;

        if (!empty($validated['parent_id'])) {
            $parent = Comment::find($validated['parent_id']);
            if ($parent && $parent->user_id !== $actorId) {
                Notification::create([
                    'user_id' => $parent->user_id,
                    'type' => 'reply',
                    'data' => [
                        'actor_name' => $request->user()->name,
                        'actor_id' => (string) $actorId,
                        'post_id' => (string) $post->id,
                        'comment_id' => (string) $comment->id,
                        'comment_excerpt' => mb_substr($comment->text, 0, 100),
                    ],
                ]);
            }
        } elseif ($post->user_id !== $actorId) {
            Notification::create([
                'user_id' => $post->user_id,
                'type' => 'comment',
                'data' => [
                    'actor_name' => $request->user()->name,
                    'actor_id' => (string) $actorId,
                    'post_id' => (string) $post->id,
                    'comment_id' => (string) $comment->id,
                    'comment_excerpt' => mb_substr($comment->text, 0, 100),
                ],
            ]);
        }

        ContentVersion::bump('posts');

        return response()->json($this->commentResponse($comment), 201);
    }

    public function update(Request $request, string $postId, string $id): JsonResponse
    {
        $comment = Comment::findOrFail((int) $id);

        if ($comment->post_id !== (int) $postId) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $comment->update(['text' => $validated['text']]);

        $comment->load('user');
        ContentVersion::bump('posts');

        return response()->json($this->commentResponse($comment));
    }

    public function destroy(Request $request, string $postId, string $id): JsonResponse
    {
        $comment = Comment::findOrFail((int) $id);

        if ($comment->post_id !== (int) $postId) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::transaction(function () use ($comment, $postId) {
            $comment->replies()->delete();
            $comment->delete();
            Post::where('id', (int) $postId)->decrement('comments_count');
        });
        ContentVersion::bump('posts');

        return response()->json(null, 204);
    }

    private function commentResponse(Comment $c): array
    {
        $replies = $c->relationLoaded('replies') && $c->replies
            ? $c->replies->map(fn($r) => $this->commentResponse($r))->values()->toArray()
            : [];

        return [
            'id' => (string) $c->id,
            'userId' => $c->user ? (string) $c->user->id : null,
            'author' => $c->user ? [
                'name' => $c->user->name,
                'avatar' => $c->user->avatar,
            ] : ['name' => 'Unknown', 'avatar' => ''],
            'text' => $c->text,
            'timeAgo' => $c->created_at?->diffForHumans() ?? 'Just now',
            'isAI' => (bool) ($c->is_ai ?? false),
            'replies' => $replies,
        ];
    }
}
