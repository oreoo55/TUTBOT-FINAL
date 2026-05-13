<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $user = User::with('badges')->findOrFail((int) $id);

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'bio' => $user->bio,
            'location' => $user->location,
            'level' => $user->level,
            'xp' => $user->xp,
            'next_level_xp' => $user->next_level_xp,
            'badges' => $user->badges->map(fn($b) => [
                'id' => (string) $b->id,
                'name' => $b->name,
                'description' => $b->description,
            ]),
            'posts_count' => $user->posts()->count(),
            'reviews_count' => $user->reviews()->count(),
            'member_since' => $user->created_at?->diffForHumans(),
        ]);
    }

    public function posts(string $id): JsonResponse
    {
        $user = User::findOrFail((int) $id);

        $posts = $user->posts()
            ->with(['user' => fn($q) => $q->withCount('badges')], 'landmark')
            ->orderByDesc('created_at')
            ->paginate(20);

        $posts->getCollection()->transform(fn($p) => app(PostController::class)->postResponse($p, null));

        return response()->json($posts);
    }

    public function reviews(string $id): JsonResponse
    {
        $user = User::findOrFail((int) $id);

        $reviews = $user->reviews()->with('user', 'landmark')
            ->orderByDesc('created_at')
            ->paginate(20);

        $reviews->getCollection()->transform(fn($r) => [
            'id' => (string) $r->id,
            'user' => [
                'id' => (string) $r->user->id,
                'name' => $r->user->name,
                'avatar' => $r->user->avatar,
            ],
            'rating' => $r->rating,
            'text' => $r->text,
            'landmark_id' => $r->landmark ? (string) $r->landmark->id : null,
            'landmark_name' => $r->landmark?->name ?? 'Unknown',
            'created_at' => $r->created_at?->toIso8601String(),
        ]);

        return response()->json($reviews);
    }
}
