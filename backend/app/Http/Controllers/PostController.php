<?php

namespace App\Http\Controllers;

use App\Models\ContentVersion;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Post::with(['user' => fn($q) => $q->withCount('badges')], 'landmark');

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($landmarkId = $request->query('landmark_id')) {
            $query->where('landmark_id', (int) $landmarkId);
        }

        $sort = $request->query('sort', 'recent');
        if ($sort === 'popular') {
            $query->orderByDesc('likes_count');
        } else {
            $query->orderByDesc('created_at');
        }

        $posts = $query->paginate(20);

        $userId = $request->user()?->id;

        $posts->getCollection()->transform(fn($p) => $this->postResponse($p, $userId));

        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'landmark_id' => 'nullable|exists:landmarks,id',
            'category' => 'sometimes|string|in:Archaeological,Museum,Religious,Recreational,Cultural,General',
            'image' => 'nullable|file|image|max:10240',
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime|max:51200',
        ]);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('uploads', 'public');
            $imageUrl = Storage::disk('public')->url($path);
        }

        $videoUrl = null;
        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('uploads', 'public');
            $videoUrl = Storage::disk('public')->url($path);
        }

        $post = Post::create([
            'user_id' => $request->user()->id,
            'landmark_id' => isset($validated['landmark_id']) ? (int) $validated['landmark_id'] : null,
            'category' => $request->input('category', 'General'),
            'text' => $validated['text'],
            'image' => $imageUrl,
            'video_url' => $videoUrl,
        ]);

        $post->load(['user' => fn($q) => $q->withCount('badges')], 'landmark');

        $request->user()->addXp(15);
        $request->user()->checkBadges();
        ContentVersion::bump('posts');

        return response()->json($this->postResponse($post, $request->user()->id), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail((int) $id);

        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:5000',
        ]);

        $post->update(['text' => $validated['text']]);

        $post->load(['user' => fn($q) => $q->withCount('badges')], 'landmark');
        ContentVersion::bump('posts');

        return response()->json($this->postResponse($post, $request->user()->id));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail((int) $id);

        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::transaction(function () use ($post) {
            $post->comments()->delete();
            $post->likes()->delete();
            $post->delete();
        });
        ContentVersion::bump('posts');
        ContentVersion::bump('landmarks');

        return response()->json(null, 204);
    }

    public function postResponse(Post $p, ?int $userId): array
    {
        return [
            'id' => (string) $p->id,
            'traveler' => [
                'id' => (string) $p->user->id,
                'name' => $p->user->name,
                'avatar' => $p->user->avatar,
                'level' => $p->user->level,
                'badges_count' => $p->user->badges_count ?? $p->user->badges()->count(),
            ],
            'landmark' => $p->landmark ? ['id' => (string) $p->landmark->id, 'name' => $p->landmark->name] : null,
            'location' => $p->landmark?->name ?? 'General',
            'category' => $p->category,
            'image' => $p->image,
            'video' => $p->video_url,
            'excerpt' => str($p->text)->limit(200)->toString(),
            'likes' => $p->likes_count,
            'comments' => $p->comments_count,
            'liked' => $userId ? $p->isLikedByUser($userId) : false,
            'date' => $p->created_at?->diffForHumans() ?? 'Just now',
        ];
    }
}
