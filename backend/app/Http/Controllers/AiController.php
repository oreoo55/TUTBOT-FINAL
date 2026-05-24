<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\Landmark;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;

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
            'quick_action' => 'nullable|string',
        ]);

        $conversationId = $validated['conversation_id'] ?? (string) Str::uuid();
        $messages = collect($validated['messages']);
        $latestUserMessage = $messages->reverse()->first(fn (array $message) => $message['role'] === 'user');
        $userText = (string) ($latestUserMessage['content'] ?? '');
        $landmarks = $this->findRelevantLandmarks($userText);
        // If a quick_action key is provided, return a canned reply without calling the LLM
        $source = 'fallback';
        if (!empty($validated['quick_action'])) {
            $assistantContent = $this->cannedReplyForQuickAction($validated['quick_action'], $landmarks, $request->user());
            $source = 'canned';
        } else {
            $assistantResult = $this->generateAssistantReply($messages->take(-12)->values()->all(), $landmarks, $request->user());
            if (is_array($assistantResult)) {
                $assistantContent = $assistantResult['content'] ?? '';
                $source = $assistantResult['source'] ?? 'fallback';
            } else {
                $assistantContent = (string) $assistantResult;
                $source = 'fallback';
            }
        }

        $assistantContent = $this->sanitizeAssistantContent($assistantContent, $landmarks);

        $conv = AiConversation::firstOrCreate(
            ['id' => $conversationId],
            [
                'user_id' => $request->user()?->id,
                'title' => 'Chat ' . now()->format('Y-m-d H:i'),
            ]
        );

        if ($latestUserMessage) {
            $conv->messages()->create([
                'role' => 'user',
                'content' => $latestUserMessage['content'],
            ]);
        }

        $suggestions = $landmarks->take(4)->map(fn ($l) => [
            'type' => 'landmark',
            'id' => (string) $l->id,
            'name' => $l->name,
        ]);

        $aiMessage = $conv->messages()->create([
            'role' => 'assistant',
            'content' => $assistantContent,
        ]);

        return response()->json([
            'conversation_id' => $conv->id,
            'message' => [
                'role' => 'assistant',
                'content' => $assistantContent,
                'suggestions' => $suggestions->toArray(),
                'source' => $source,
            ],
        ]);
    }

    private function cannedReplyForQuickAction(string $key, Collection $landmarks, ?\App\Models\User $user = null): string
    {
        $top = $landmarks->take(4)->map(fn (Landmark $l) => sprintf('- %s (%s, %s EGP)', $l->name, $l->region, $l->price))->implode("\n");

        switch ($key) {
            case 'top_sights_cairo':
                return "Here are top sights to visit in Cairo:\n\n" . $top . "\n\nFor details, open any landmark page to see hours, tickets, and directions.";
            case '3_day_itinerary':
                return "A suggested 3-day itinerary:\n\nDay 1: Cairo highlights (museums and Giza pyramids)\nDay 2: Travel south to Luxor — temples and Karnak\nDay 3: Relax by the Nile or visit Aswan's highlights.\n\nTell me which cities you prefer and I can tailor it.";
            case 'budget_low':
                return "Budget-friendly options: choose local museums, free walking areas, and low-cost group tours. Here are a few affordable picks:\n\n" . $top;
            case 'luxury_trip':
                return "Luxury ideas: private guides, Nile cruise suites, and exclusive museum after-hours. Consider these premium spots:\n\n" . $top;
            case 'beach_getaway':
                return "Beach getaway picks: Hurghada, Sharm El-Sheikh, and Dahab have excellent resorts and diving. Top nearby attractions:\n\n" . $top;
            case 'family_friendly':
                return "Family-friendly attractions include interactive museums, easy-access sites, and boat trips on the Nile. Try these family-friendly places:\n\n" . $top;
            default:
                return "I can help with that — tell me more about what you'd like and I will suggest relevant places and plans.";
        }
    }

    /**
     * Return either a string (legacy) or an array with 'content' and 'source'.
     * source is 'llm' when provider responded, otherwise 'fallback'.
     */
    private function generateAssistantReply(array $messages, Collection $landmarks, ?\App\Models\User $user = null)
    {
        $systemPrompt = $this->systemPrompt($landmarks, $user);
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            return $this->localFallbackReply($messages, $landmarks, $user);
        }

        // Try a list of candidate model names to improve compatibility with OpenRouter/OpenWater
        $modelCandidates = array_values(array_unique(array_filter([
            config('services.openai.model', 'gpt-4o-mini'),
            'gpt-4o-mini',
            'gpt-3o-mini',
            'gpt-3o-mini-2024-12-17',
            'gpt-4o',
        ])));

        foreach ($modelCandidates as $model) {
            try {
                $response = Http::baseUrl(rtrim((string) config('services.openai.base_url', 'https://api.openai.com/v1'), '/'))
                    ->timeout(30)
                    ->retry(1, 250)
                    ->withToken($apiKey)
                    ->acceptJson()
                    ->post('/chat/completions', [
                        'model' => $model,
                        'temperature' => 0.4,
                        'messages' => array_merge([
                            ['role' => 'system', 'content' => $systemPrompt],
                        ], $messages),
                    ]);

                if ($response->successful()) {
                    $content = (string) data_get($response->json(), 'choices.0.message.content', '');
                    if ($content !== '') {
                        return ['content' => trim($content), 'source' => 'llm'];
                    }
                } else {
                    \Log::warning('LLM request not successful', [
                        'model' => $model,
                        'status' => $response->status(),
                        'body' => substr((string) $response->body(), 0, 200),
                    ]);
                }
            } catch (ConnectionException $e) {
                \Log::error('LLM connection exception', ['model' => $model, 'error' => $e->getMessage()]);
            } catch (\Throwable $e) {
                \Log::error('LLM request exception', ['model' => $model, 'error' => $e->getMessage()]);
            }
        }

        // If all providers/models fail, fall back to local reply
        $fallback = $this->localFallbackReply($messages, $landmarks, $user);
        return ['content' => $fallback, 'source' => 'fallback'];
    }

    private function systemPrompt(Collection $landmarks, ?\App\Models\User $user = null): string
    {
        $facts = $landmarks->map(function (Landmark $landmark) {
            $description = Str::limit(trim(strip_tags((string) $landmark->description)), 180);

            return sprintf(
                '- %s | region: %s | category: %s | price: %s EGP | hours: %s-%s | rating: %s | summary: %s',
                $landmark->name,
                $landmark->region,
                $landmark->category,
                (string) $landmark->price,
                $landmark->opening_hours ?? 'n/a',
                $landmark->closing_hours ?? 'n/a',
                (string) $landmark->rating,
                $description !== '' ? $description : 'n/a'
            );
        })->implode("\n");

        $guestNote = $user ? 'The user is signed in.' : 'The user is a guest.';

        return <<<PROMPT
You are Tut-Assistant for TUTBOT, an Egypt travel platform.

Speak warmly and concisely in English.
You help with Egyptian travel planning, landmarks, budgeting, and booking guidance.
Never invent prices or opening hours. Use only the landmark facts below.
If the question is unrelated to Egypt travel, gently steer the user back to travel.
If the answer needs more exact landmark facts than provided, say so clearly and suggest browsing the landmark pages.

{$guestNote}

Relevant landmark facts:
{$facts}
PROMPT;
    }

    private function localFallbackReply(array $messages, Collection $landmarks, ?\App\Models\User $user = null): string
    {
        $latestUserMessage = collect($messages)->reverse()->first(fn (array $message) => $message['role'] === 'user');
        $userText = mb_strtolower((string) ($latestUserMessage['content'] ?? ''));

        if ($this->isOffTopic($userText)) {
            return 'I can help with Egypt travel, landmarks, budgets, and itineraries. If you want, ask me about a city, a budget, or a place to visit in Egypt.';
        }

        if (str_contains($userText, 'wishlist') || str_contains($userText, 'favorites')) {
            return $user
                ? 'I can help with that once collections are connected in the AI backend. For now, browse your profile pages for saved items.'
                : 'Please sign in so I can access your saved travel data.';
        }

        $top = $landmarks->take(3)->map(fn (Landmark $landmark) => sprintf(
            '- %s in %s (%s, %s EGP)',
            $landmark->name,
            $landmark->region,
            $landmark->category,
            $landmark->price
        ))->implode("\n");

        return trim("I can help you plan an Egypt trip, choose landmarks, and compare budgets.\n\nHere are a few good starting points:\n{$top}\n\nTell me your budget, region, or trip style and I will narrow it down.");
    }

    private function isOffTopic(string $text): bool
    {
        $travelKeywords = [
            'travel', 'trip', 'visit', 'tour', 'itinerary', 'budget', 'landmark', 'museum', 'cairo',
            'giza', 'luxor', 'aswan', 'alexandria', 'hurghada', 'sharm', 'dahab', 'egypt', 'beach',
            'hotel', 'flight', 'booking', 'ticket', 'guide', 'day', 'days', 'family', 'solo', 'romantic',
        ];

        $offTopicKeywords = [
            'politic', 'election', 'government', 'parliament', 'war', 'weapon', 'medical', 'diagnos',
            'symptom', 'medicine', 'law', 'finance', 'stock', 'religion debate', 'philosophy',
            'programming', 'code', 'software', 'math', 'chemistry', 'physics',
        ];

        foreach ($offTopicKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return true;
            }
        }

        foreach ($travelKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return false;
            }
        }

        return false;
    }

    private function sanitizeAssistantContent(string $content, Collection $landmarks): string
    {
        $content = trim($content);

        if ($content === '') {
            return $this->localFallbackReply([], $landmarks);
        }

        return $content;
    }

    private function findRelevantLandmarks(string $query): Collection
    {
        $query = trim($query);
        $terms = $this->extractSearchTerms($query);

        if ($terms === []) {
            return Landmark::orderByDesc('rating')->limit(6)->get();
        }

        $landmarks = Landmark::query()
            ->where(function ($builder) use ($terms) {
                foreach ($terms as $term) {
                    $builder->orWhere('name', 'like', '%' . $term . '%')
                        ->orWhere('region', 'like', '%' . $term . '%')
                        ->orWhere('category', 'like', '%' . $term . '%')
                        ->orWhere('description', 'like', '%' . $term . '%');
                }
            })
            ->orderByDesc('rating')
            ->limit(6)
            ->get();

        if ($landmarks->isNotEmpty()) {
            return $landmarks;
        }

        return Landmark::orderByDesc('rating')->limit(6)->get();
    }

    private function extractSearchTerms(string $query): array
    {
        $stopWords = [
            'plan', 'trip', 'budget', 'day', 'days', 'visit', 'visiting', 'help', 'best', 'cheap',
            'price', 'prices', 'ticket', 'tickets', 'want', 'need', 'show', 'tell', 'about', 'for',
            'the', 'and', 'with', 'from', 'into', 'over', 'near', 'around', 'this', 'that', 'what',
            'where', 'how', 'much', 'can', 'you', 'your', 'please', 'find', 'recommend', 'suggest',
        ];

        $terms = preg_split('/[^\pL\pN]+/u', mb_strtolower($query), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $terms = array_values(array_unique(array_filter($terms, function (string $term) use ($stopWords) {
            return mb_strlen($term) >= 3 && !in_array($term, $stopWords, true) && !ctype_digit($term);
        })));

        return $terms;
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
