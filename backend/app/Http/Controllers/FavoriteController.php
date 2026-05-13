<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $favorites = $user->favorites()->get()->map(fn($l) => LandmarkController::landmarkResponse($l));

        return response()->json(['data' => $favorites]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['landmark_id' => 'required|exists:landmarks,id']);

        $user = $request->user();
        $landmarkId = (int) $validated['landmark_id'];
        $alreadyFav = $user->favorites()->where('landmark_id', $landmarkId)->exists();

        if (!$alreadyFav) {
            $user->favorites()->attach($landmarkId);
            $user->addXp(5);
            $user->checkBadges();
        }

        $landmark = \App\Models\Landmark::find($landmarkId);

        return response()->json(['landmark' => LandmarkController::landmarkResponse($landmark)], 201);
    }

    public function destroy(Request $request, string $landmarkId): JsonResponse
    {
        $request->user()->favorites()->detach((int) $landmarkId);

        return response()->json(null, 204);
    }
}
