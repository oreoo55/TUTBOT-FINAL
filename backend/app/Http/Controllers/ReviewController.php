<?php

namespace App\Http\Controllers;

use App\Models\ContentVersion;
use App\Models\Landmark;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function random(): JsonResponse
    {
        $reviews = Review::with('user', 'landmark')
            ->inRandomOrder()
            ->limit(4)
            ->get()
            ->map(fn($r) => [
                'id' => (string) $r->id,
                'user_id' => $r->user ? (string) $r->user->id : null,
                'name' => $r->user?->name ?? 'Anonymous',
                'avatar' => $r->user?->avatar ?? null,
                'rating' => $r->rating,
                'text' => $r->text,
                'location' => $r->landmark?->city ?? $r->landmark?->region ?? 'Egypt',
                'landmark_name' => $r->landmark?->name ?? '',
            ]);

        return response()->json(['data' => $reviews]);
    }

    public function index(string $landmarkId): JsonResponse
    {
        $landmark = Landmark::findOrFail((int) $landmarkId);

        $reviews = $landmark->reviews()->with('user')->paginate(20);

        $reviews->getCollection()->transform(fn($r) => [
            'id' => (string) $r->id,
            'user' => [
                'id' => (string) $r->user->id,
                'name' => $r->user->name,
                'avatar' => $r->user->avatar,
            ],
            'rating' => $r->rating,
            'text' => $r->text,
            'created_at' => $r->created_at?->toIso8601String(),
        ]);

        return response()->json($reviews);
    }

    public function store(Request $request, string $landmarkId): JsonResponse
    {
        $landmark = Landmark::findOrFail((int) $landmarkId);

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string|max:2000',
        ]);

        $uid = $request->user()->id;
        if (Review::where('user_id', $uid)->where('landmark_id', $landmark->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this landmark.'], 409);
        }

        $review = Review::create([
            'user_id' => $uid,
            'landmark_id' => $landmark->id,
            'rating' => $validated['rating'],
            'text' => $validated['text'],
        ]);

        $landmark->reviews_count = $landmark->reviews()->count();
        $landmark->rating = round($landmark->reviews()->avg('rating'), 2);
        $landmark->save();

        $review->load('user');

        $request->user()->addXp(20);
        $request->user()->checkBadges();
        ContentVersion::bump('reviews');
        ContentVersion::bump('landmarks');

        return response()->json([
            'id' => (string) $review->id,
            'user' => [
                'id' => (string) $review->user->id,
                'name' => $review->user->name,
                'avatar' => $review->user->avatar,
            ],
            'rating' => $review->rating,
            'text' => $review->text,
            'created_at' => $review->created_at?->toIso8601String(),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $review = Review::findOrFail((int) $id);

        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string|max:2000',
        ]);

        $review->update($validated);

        $landmark = $review->landmark;
        $landmark->reviews_count = $landmark->reviews()->count();
        $landmark->rating = round($landmark->reviews()->avg('rating'), 2);
        $landmark->save();

        $review->load('user');
        ContentVersion::bump('reviews');
        ContentVersion::bump('landmarks');

        return response()->json([
            'id' => (string) $review->id,
            'user' => [
                'id' => (string) $review->user->id,
                'name' => $review->user->name,
                'avatar' => $review->user->avatar,
            ],
            'rating' => $review->rating,
            'text' => $review->text,
            'created_at' => $review->created_at?->toIso8601String(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $review = Review::findOrFail((int) $id);

        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $landmark = $review->landmark;
        $review->delete();

        $landmark->reviews_count = $landmark->reviews()->count();
        $landmark->rating = round($landmark->reviews()->avg('rating'), 2);
        $landmark->save();
        ContentVersion::bump('reviews');
        ContentVersion::bump('landmarks');

        return response()->json(null, 204);
    }
}
