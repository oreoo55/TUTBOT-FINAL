<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $wishlist = $user->wishlist()->get()->map(fn($l) => LandmarkController::landmarkResponse($l));

        return response()->json(['data' => $wishlist]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['landmark_id' => 'required|exists:landmarks,id']);

        $request->user()->wishlist()->syncWithoutDetaching([(int) $validated['landmark_id']]);

        $landmark = \App\Models\Landmark::find((int) $validated['landmark_id']);

        return response()->json(['landmark' => LandmarkController::landmarkResponse($landmark)], 201);
    }

    public function destroy(Request $request, string $landmarkId): JsonResponse
    {
        $request->user()->wishlist()->detach((int) $landmarkId);

        return response()->json(null, 204);
    }
}
