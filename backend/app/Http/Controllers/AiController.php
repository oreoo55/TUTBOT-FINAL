<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\Landmark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AiController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'nullable|string|uuid',
            'messages' => 'required|array',
            'messages.*.role' => 'required|in:user,assistant,system,tool',
            'messages.*.content' => 'required|string',
            'context' => 'nullable|array',
        ]);

        $conversationId = $validated['conversation_id'] ?? (string) Str::uuid();

        $conv = AiConversation::firstOrCreate(
            ['id' => $conversationId],
            [
                'user_id' => $request->user()?->id,
                'title' => 'Chat ' . now()->format('Y-m-d H:i'),
            ]
        );

        $userMessage = collect($validated['messages'])->last();
        if ($userMessage && $userMessage['role'] === 'user') {
            $conv->messages()->create([
                'role' => 'user',
                'content' => $userMessage['content'],
            ]);
        }

        $topLandmarks = Landmark::orderByDesc('rating')->limit(6)->get();
        $suggestions = $topLandmarks->map(fn($l) => [
            'type' => 'landmark',
            'id' => (string) $l->id,
            'name' => $l->name,
        ]);

        $content = "Welcome to TUTBOT! I'm Tut-Assistant, your Egyptian travel companion.\n\n";
        $content .= "I can help you plan trips, discover landmarks, and find the best experiences across Egypt.\n\n";
        $content .= "Here are some highly-rated destinations you might enjoy:\n\n";
        foreach ($topLandmarks as $l) {
            $content .= "- **{$l->name}** in {$l->region} — ⭐ {$l->rating}\n";
        }
        $content .= "\nWhat kind of experience are you looking for?";

        $aiMessage = $conv->messages()->create([
            'role' => 'assistant',
            'content' => $content,
        ]);

        return response()->json([
            'conversation_id' => $conv->id,
            'message' => [
                'role' => 'assistant',
                'content' => $content,
                'suggestions' => $suggestions->toArray(),
            ],
        ]);
    }

    public function recommendations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'context' => 'nullable|array',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $limit = $validated['limit'] ?? 6;
        $context = $validated['context'] ?? [];

        $query = Landmark::query();

        if (!empty($context['budget'])) {
            $costMap = ['low' => 'Budget', 'moderate' => 'Moderate', 'luxury' => 'Luxury'];
            $costLevel = $costMap[$context['budget']] ?? null;
            if ($costLevel) {
                $query->where('cost_level', $costLevel);
            }
        }

        if (!empty($context['interests'])) {
            $interestCategories = [
                'history' => ['Archaeological', 'Museum', 'Cultural'],
                'beach' => ['Recreational'],
                'food' => ['Cultural'],
                'adventure' => ['Recreational', 'Archaeological'],
            ];

            $categories = [];
            foreach ((array) $context['interests'] as $interest) {
                if (isset($interestCategories[$interest])) {
                    $categories = array_merge($categories, $interestCategories[$interest]);
                }
            }

            if (!empty($categories)) {
                $query->whereIn('category', array_unique($categories));
            }
        }

        if (!empty($context['season']) && $context['season'] !== 'all') {
            $seasonMap = ['winter' => 'Winter', 'summer' => 'Summer', 'spring' => 'Spring', 'autumn' => 'Autumn'];
            $season = $seasonMap[$context['season']] ?? null;
            if ($season) {
                $query->where('best_season', $season);
            }
        }

        $landmarks = $query->orderByDesc('rating')->limit($limit)->get();

        return response()->json([
            'data' => $landmarks->map(fn($l) => LandmarkController::landmarkResponse($l)),
        ]);
    }
}
