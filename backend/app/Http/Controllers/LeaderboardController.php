<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class LeaderboardController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::withCount('badges')
            ->orderByDesc('level')
            ->orderByDesc('xp')
            ->limit(20)
            ->get()
            ->map(fn($u) => [
                'id' => (string) $u->id,
                'name' => $u->name,
                'avatar' => $u->avatar,
                'level' => $u->level,
                'badges' => $u->badges_count,
            ]);

        return response()->json(['data' => $users]);
    }
}
