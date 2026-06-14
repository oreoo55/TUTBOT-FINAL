<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\Hotel;
use App\Models\Landmark;
use App\Models\Restaurant;
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
            'guest_id' => 'nullable|string|size:36',
        ]);

        $conversationId = $validated['conversation_id'] ?? (string) Str::uuid();
        $messages = collect($validated['messages']);
        $latestUserMessage = $messages->reverse()->first(fn (array $message) => $message['role'] === 'user');
        $userText = (string) ($latestUserMessage['content'] ?? '');
        $isSmallTalk = $this->isSmallTalk($userText);
        $landmarks = $isSmallTalk ? collect() : $this->findRelevantLandmarks($userText);
        $restaurants = $isSmallTalk ? collect() : $this->findRelevantRestaurants($userText);
        $hotels = $isSmallTalk ? collect() : $this->findRelevantHotels($userText);
        // If a quick_action key is provided, return a canned reply without calling the LLM
        $source = 'fallback';
        if (!empty($validated['quick_action'])) {
            $assistantContent = $this->cannedReplyForQuickAction($validated['quick_action'], $landmarks, $restaurants, $hotels, $request->user());
            $source = 'canned';
        } else {
            $assistantResult = $this->generateAssistantReply($messages->take(-12)->values()->all(), $landmarks, $restaurants, $hotels, $request->user());
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
                'guest_id' => $request->user() ? null : ($validated['guest_id'] ?? null),
                'title' => $latestUserMessage ? Str::limit($latestUserMessage['content'], 35) : ('Chat ' . now()->format('Y-m-d H:i')),
            ]
        );

        if ($request->user() && !$conv->user_id) {
            $conv->update(['user_id' => $request->user()->id, 'guest_id' => null]);
        } elseif (!$request->user() && ($validated['guest_id'] ?? null) && !$conv->guest_id) {
            $conv->update(['guest_id' => $validated['guest_id']]);
        }

        if ($latestUserMessage) {
            $conv->messages()->create([
                'role' => 'user',
                'content' => $latestUserMessage['content'],
            ]);
        }

        $suggestions = $this->buildSuggestions($assistantContent, $landmarks, $restaurants, $hotels);

        $aiMessage = $conv->messages()->create([
            'role' => 'assistant',
            'content' => $assistantContent,
        ]);

        if ($conv->wasRecentlyCreated && $assistantContent) {
            $conv->update(['title' => Str::limit(str_replace(['*', '#', '-'], '', $assistantContent), 35)]);
        }

        return response()->json([
            'conversation_id' => $conv->id,
            'message' => [
                'role' => 'assistant',
                'content' => $assistantContent,
                'suggestions' => $suggestions->values()->toArray(),
                'source' => $source,
            ],
        ]);
    }

    private function cannedReplyForQuickAction(string $key, Collection $landmarks, Collection $restaurants, Collection $hotels, ?\App\Models\User $user = null): string
    {
        $top = $landmarks->take(6)->map(fn (Landmark $l) => sprintf(
            '- **%s** — %s | %s | %s EGP | ★%s',
            $l->name,
            $l->region,
            $l->category,
            $l->price === 0 ? 'Free' : $l->price,
            $l->rating
        ))->implode("\n");

        $topEats = $restaurants->take(3)->map(fn (Restaurant $r) => sprintf(
            '- **%s** (%s) — %s, %s',
            $r->name,
            $r->category,
            $r->region,
            $r->price_level ?? 'n/a'
        ))->implode("\n");

        $topStays = $hotels->take(3)->map(fn (Hotel $h) => sprintf(
            '- **%s** (%s) — %s, %s',
            $h->name,
            $h->star_rating,
            $h->region,
            $h->price_level ?? 'n/a'
        ))->implode("\n");

        switch ($key) {
            case 'top_sights_cairo':
                $cairo = $landmarks->filter(fn (Landmark $l) => stripos($l->region, 'cairo') !== false || stripos($l->region, 'giza') !== false)->take(6);
                $cairoList = $cairo->map(fn (Landmark $l) => sprintf(
                    '- **%s** (★%s) — %s | %s EGP | %s',
                    $l->name, $l->rating, $l->category,
                    $l->price === 0 ? 'Free' : $l->price,
                    Str::limit(strip_tags((string) $l->description), 100)
                ))->implode("\n");

                return "**Top Sights in Cairo & Giza** 🏛️\n\n"
                    . ($cairoList ?: $top)
                    . "\n\n**Where to Eat** 🍽️\n" . ($topEats ?: '—')
                    . "\n\n**Where to Stay** 🏨\n" . ($topStays ?: '—')
                    . "\n\n---\nTip: most sites open daily 9 AM–5 PM. Book tickets early for Giza pyramids and the Grand Egyptian Museum!";

            case '3_day_itinerary':
                $luxorTemples = ['Karnak Temple', 'Luxor Temple', 'Valley of the Kings', 'Hatshepsut Temple', 'Colossi of Memnon'];
                $aswanSights = ['Philae Temple', 'Abu Simbel', 'Aswan High Dam', 'Nile Felucca Ride', 'Nubian Village'];
                $cairoSights = $landmarks->filter(fn (Landmark $l) => stripos($l->region, 'cairo') !== false || stripos($l->region, 'giza') !== false)->take(4);

                $day1Cairo = $cairoSights->map(fn (Landmark $l) => sprintf(
                    '  • %s — %s (%s EGP)', $l->name, $l->category, $l->price === 0 ? 'Free' : $l->price
                ))->implode("\n") ?: "  • Giza Pyramids\n  • Egyptian Museum\n  • Khan El Khalili Bazaar";

                return "**Suggested 3-Day Egypt Itinerary** 🗺️\n\n"
                    . "**Day 1 — Cairo** (Great Pyramid & Museum)\n" . $day1Cairo
                    . "\n🥘 Lunch: " . ($restaurants->first()?->name ?? 'local Egyptian kushari spot')
                    . "\n🏨 Stay: " . ($hotels->first()?->name ?? 'hotel in Zamalek or downtown Cairo')
                    . "\n\n**Day 2 — Luxor** (Temples & Tombs)\n"
                    . "  • " . implode("\n  • ", array_slice($luxorTemples, 0, 3))
                    . "\n🥘 Lunch: A local restaurant on the Nile corniche"
                    . "\n🏨 Stay: " . ($hotels->skip(1)->first()?->name ?? 'Nile-view hotel in Luxor')
                    . "\n\n**Day 3 — Aswan** (Philae & Nile vibes)\n"
                    . "  • " . implode("\n  • ", array_slice($aswanSights, 0, 3))
                    . "\n🥘 Dinner: Fresh Nile fish at a floating restaurant"
                    . "\n\n---\n*This is a packed itinerary. You can swap days or skip sights to go at your own pace. Want me to tailor it to a specific city or budget?*";

            case 'budget_low':
                $budgetLandmarks = $landmarks->sortBy('price')->take(6);
                $budgetList = $budgetLandmarks->map(fn (Landmark $l) => sprintf(
                    '- **%s** (%s) — %s | **%s EGP** | ★%s',
                    $l->name, $l->region, $l->category,
                    $l->price === 0 ? 'Free' : $l->price,
                    $l->rating
                ))->implode("\n");

                $budgetEats = $restaurants->filter(fn ($r) => ($r->price_level ?? '') === '$' || ($r->price_level ?? '') === '$$' || stripos($r->description ?? '', 'budget') !== false || stripos($r->description ?? '', 'affordable') !== false)->take(3);
                $budgetEatList = $budgetEats->map(fn (Restaurant $r) => sprintf(
                    '- **%s** (%s) — %s', $r->name, $r->category, $r->region
                ))->implode("\n");

                return "**Budget-Friendly Egypt Travel** 💰\n\n"
                    . "**Affordable Landmarks** 🏛️\n" . ($budgetList ?: $top)
                    . "\n\n**Budget Eats** 🍽️\n" . ($budgetEatList ?: $topEats ?: 'Try street food like kushari, taameya, and ful!')
                    . "\n\n**Money-Saving Tips** ✅\n"
                    . "  • Student discounts available at most museums (bring your ID)\n"
                    . "  • Visit early morning — fewer crowds, cooler weather\n"
                    . "  • Use Cairo Metro (2 EGP) and Uber for affordable transport\n"
                    . "  • Eat at local spots — kushari is 15–30 EGP per plate!";

            case 'luxury_trip':
                return "**Luxury Egypt Experiences** ✨\n\n"
                    . "**Premium Landmarks** 🏛️\n" . $top
                    . "\n\n**Fine Dining** 🍽️\n" . ($topEats ?: '—')
                    . "\n\n**Top Hotels** 🏨\n" . ($topStays ?: '—')
                    . "\n\n**Luxury Upgrades** 💎\n"
                    . "  • Private Egyptologist guide for exclusive tours\n"
                    . "  • Nile cruise suite with private balcony\n"
                    . "  • Hot air balloon over Luxor at sunrise\n"
                    . "  • VIP access at Giza Pyramids Sound & Light show\n"
                    . "  • Private transfer in luxury vehicle with Wi-Fi";

            case 'beach_getaway':
                $coastalLm = $landmarks->filter(fn (Landmark $l) =>
                    stripos($l->region, 'hurghada') !== false ||
                    stripos($l->region, 'sharm') !== false ||
                    stripos($l->region, 'dahab') !== false ||
                    stripos($l->category, 'beach') !== false ||
                    stripos($l->category, 'Recreational') !== false
                )->take(4);

                $coastalList = $coastalLm->map(fn (Landmark $l) => sprintf(
                    '- **%s** (%s) — ★%s', $l->name, $l->region, $l->rating
                ))->implode("\n");

                $beachHotels = $hotels->filter(fn (Hotel $h) =>
                    stripos($h->region, 'hurghada') !== false ||
                    stripos($h->region, 'sharm') !== false ||
                    stripos($h->region, 'dahab') !== false ||
                    stripos($h->region, 'gouna') !== false ||
                    stripos($h->region, 'marsa') !== false
                )->take(4);

                $beachHotelList = $beachHotels->map(fn (Hotel $h) => sprintf(
                    '- **%s** (%s) — %s, ★%s', $h->name, $h->star_rating, $h->region, $h->rating
                ))->implode("\n");

                return "**Beach Getaways in Egypt** 🏖️\n\n"
                    . "**Top Coastal Destinations** 🌊\n"
                    . "  • **Hurghada** — world-class diving, water sports, resort strip\n"
                    . "  • **Sharm El-Sheikh** — Ras Mohammed National Park, coral reefs\n"
                    . "  • **Dahab** — backpacker vibe, Blue Hole diving, windsurfing\n"
                    . "  • **El Gouna** — upscale lagoon town, kitesurfing, golf\n\n"
                    . ($coastalList ? "**Nearby Attractions** 🏛️\n" . $coastalList . "\n\n" : '')
                    . ($beachHotelList ? "**Beach Resorts** 🏨\n" . $beachHotelList : ($topStays ? "**Recommended Hotels** 🏨\n" . $topStays : ''))
                    . "\n\n---\nMost Red Sea resorts offer all-inclusive packages. Snorkeling gear is usually complementary!";

            case 'family_friendly':
                $familyLm = $landmarks->filter(fn (Landmark $l) =>
                    stripos($l->region, 'cairo') !== false ||
                    stripos($l->category, 'Museum') !== false ||
                    stripos($l->category, 'Recreational') !== false
                )->take(5);

                $familyList = $familyLm->map(fn (Landmark $l) => sprintf(
                    '- **%s** (%s) — %s | %s EGP | ★%s',
                    $l->name, $l->region, $l->category,
                    $l->price === 0 ? 'Free' : $l->price,
                    $l->rating
                ))->implode("\n");

                return "**Family-Friendly Egypt** 👨‍👩‍👧‍👦\n\n"
                    . ($familyList ? "**Great for Kids** 🏛️\n" . $familyList . "\n\n" : $top . "\n\n")
                    . "**Family Travel Tips** ✅\n"
                    . "  • Book private tours — flexible timing, kid-friendly pace\n"
                    . "  • Stay in hotels with pools and kids' clubs\n"
                    . "  • Visit early morning to avoid heat and crowds\n"
                    . "  • Try a Nile felucca ride — gentle, scenic, fun for all ages\n"
                    . "  • Egyptian Museum has a dedicated children's section\n\n"
                    . ($topEats ? "**Kid-Friendly Eats** 🍽️\n" . $topEats : '');

            default:
                return "I can help plan your Egypt trip — tell me more and I'll suggest relevant places and plans.";
        }
    }

    /**
     * Return either a string (legacy) or an array with 'content' and 'source'.
     * source is 'llm' when provider responded, otherwise 'fallback'.
     */
    private function generateAssistantReply(array $messages, Collection $landmarks, Collection $restaurants, Collection $hotels, ?\App\Models\User $user = null)
    {
        $systemPrompt = $this->systemPrompt($landmarks, $restaurants, $hotels, $user);
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            return $this->localFallbackReply($messages, $landmarks, $user);
        }

        // Try a list of candidate model names to improve compatibility with OpenRouter/OpenWater
        $modelCandidates = array_values(array_unique(array_filter([
            config('services.openai.model', 'openai/gpt-4o-mini'),
            'openai/gpt-4o-mini',
            'openai/gpt-3o-mini',
            'openai/gpt-3o-mini-2024-12-17',
            'openai/gpt-4o',
        ])));

        foreach ($modelCandidates as $model) {
            try {
                $response = Http::baseUrl(rtrim((string) config('services.openai.base_url', 'https://openrouter.ai/api/v1'), '/'))
                    ->timeout(30)
                    ->retry(1, 250)
                    ->withToken($apiKey)
                    ->acceptJson()
                    ->withHeaders([
                        'HTTP-Referer' => config('app.url', 'http://localhost:8000'),
                        'X-Title' => config('app.name', 'TUTBOT'),
                    ])
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

    private function systemPrompt(Collection $landmarks, Collection $restaurants, Collection $hotels, ?\App\Models\User $user = null): string
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

        $allOverview = Landmark::select('name', 'region')
            ->orderBy('region')
            ->orderBy('name')
            ->get()
            ->groupBy('region')
            ->map(fn (Collection $group, string $region) => '[' . $region . '] ' . $group->pluck('name')->implode(', '))
            ->implode("\n");

        try {
            $allRestaurantsCollection = Restaurant::orderBy('region')->orderBy('name')->get();
            $restaurantOverview = $allRestaurantsCollection
                ->groupBy('region')
                ->map(fn (Collection $group, string $region) => '[' . $region . '] ' . $group->map(fn ($r) => $r->name . ' (' . $r->category . ', ' . ($r->price_level ?? 'n/a') . ', ★' . $r->rating . ')')->implode(', '))
                ->implode("\n");
            $restaurantFacts = $allRestaurantsCollection->map(fn (Restaurant $r) => implode("\n", [
                "  • {$r->name}",
                '    Cuisine: ' . $r->category . ' | Area: ' . $r->region . ' | Price: ' . ($r->price_level ?? 'n/a') . ' | Rating: ' . $r->rating . '/5',
                '    Address: ' . $r->address,
                '    Phone: ' . ($r->phone ?? 'n/a'),
                '    Hours: ' . ($r->opening_hours ?? 'n/a'),
                "    Info: " . ($r->description ? Str::limit($r->description, 150) : 'n/a'),
            ]))->implode("\n");
        } catch (\Throwable $e) {
            \Log::warning('Failed to load restaurant data for AI prompt', ['error' => $e->getMessage()]);
            $restaurantOverview = '(no restaurant data available)';
            $restaurantFacts = '(no restaurant data available)';
        }

        try {
            $allHotelsCollection = Hotel::orderBy('region')->orderBy('name')->get();
            $hotelOverview = $allHotelsCollection
                ->groupBy('region')
                ->map(fn (Collection $group, string $region) => '[' . $region . '] ' . $group->map(fn ($h) => $h->name . ' (' . $h->star_rating . ', ' . ($h->price_level ?? 'n/a') . ', ★' . $h->rating . ')')->implode(', '))
                ->implode("\n");
            $hotelFacts = $allHotelsCollection->map(fn (Hotel $h) => implode("\n", [
                "  • {$h->name}",
                '    Rating: ' . $h->star_rating . ' | Price: ' . ($h->price_level ?? 'n/a') . ' | Guest Rating: ' . $h->rating . '/5',
                '    Neighborhood: ' . ($h->neighborhood ?? 'n/a'),
                '    Address: ' . $h->address,
                '    Phone: ' . ($h->phone ?? 'n/a'),
                '    Amenities: ' . ($h->amenities ?? 'n/a'),
                "    Info: " . ($h->description ? Str::limit($h->description, 150) : 'n/a'),
            ]))->implode("\n");
        } catch (\Throwable $e) {
            \Log::warning('Failed to load hotel data for AI prompt', ['error' => $e->getMessage()]);
            $hotelOverview = '(no hotel data available)';
            $hotelFacts = '(no hotel data available)';
        }

        $guestNote = $user ? 'The user is signed in.' : 'The user is a guest.';

        return <<<PROMPT
You are "TutBot", the ultimate AI Trip Planner and intelligent concierge for Egypt tourism website (TutBot). Your primary goal is to help users plan trips, discover landmarks, find accommodation, and explore the food scene across Egypt with 100% accuracy and responsiveness.

{$guestNote}

===== CORE RULES FOR RESPONSE ACCURACY (Anti-Hallucination Guardrails) =====
1. Never hallucinate or invent fake data. If you are not 100% sure about a phone number or exact address, provide the exact location name and state: "Please verify the contact details directly as they might change."
2. Be hyper-local. If the user asks for a specific neighborhood like "Zamalek", "Maadi", or "Downtown", ONLY suggest places within that exact boundary. Do not mix them with other areas.
3. Be structured and scannable. Use bold text for emphasis. Use dash bullet points (-) for all lists — never use numbered lists.

===== YOUR CAPABILITIES & RESPONSE SCHEMAS =====

1. Accommodation & Hotels:
When asked about hotels in any Egyptian governorate/city, provide a detailed response including:
- Hotel Name & Star Rating.
- Brief overview of the vibe and amenities.
- Contact Number (if verified) or official booking reference.
- Location description (include a Google Maps link ONLY if the user explicitly asks for directions or the exact location).

2. Food & Dining ("Where to eat"):
When asked "Where to eat in [City/Neighborhood]" (e.g., Cairo, Giza, Zamalek):
- Categorize by cuisine type or vibe (e.g., Traditional Egyptian, Fine Dining, Casual/Cafes).
- For each restaurant provide: Name, Exact Neighborhood, Speciality Dish, Estimated Budget, Phone Number, and Location/Address details.

3. Landmarks & Historical Sites:
If the user asks about ANY landmark in Egypt (whether it's on the website or a general one):
- Provide a concise yet rich brief/summary of the landmark (History, importance, best time to visit).
- Mention its exact location/governorate.
- Gently remind the user: "You can check our main website to see if tickets and guided tours are available for booking for this landmark."

===== LANGUAGE & TONE =====
- Respond in the same language the user uses (Egyptian Arabic or English).
- Tone should be welcoming, professional, expert, and deeply knowledgeable about Egyptian culture and geography.

===== STRICT BOUNDARY =====
- If the user asks about things completely unrelated to travel, Egypt, tourism, food, or hotels, politely redirect them back to your core purpose: "I'm TutBot, your Egyptian travel companion. Let's focus on planning your perfect trip to Egypt!"

===== LANDMARK DATA FROM OUR WEBSITE =====
ALL LANDMARKS OVERVIEW (grouped by region):
{$allOverview}

Relevant landmark facts:
{$facts}

===== RESTAURANT DATA FROM OUR WEBSITE =====
ALL RESTAURANTS IN OUR DATABASE (grouped by region):
{$restaurantOverview}

RESTAURANT DETAILS (including phone numbers):
{$restaurantFacts}

===== HOTEL DATA FROM OUR WEBSITE =====
ALL HOTELS IN OUR DATABASE (grouped by region):
{$hotelOverview}

HOTEL DETAILS (including phone numbers):
{$hotelFacts}
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

        $top = $landmarks->take(5)->map(fn (Landmark $landmark) => sprintf(
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
            'restaurant', 'food', 'eat', 'dine', 'cuisine', 'dinner', 'lunch', 'breakfast',
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

    private function isSmallTalk(string $text): bool
    {
        $text = mb_strtolower(trim($text));
        $greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'good morning', 'good evening', 'good afternoon'];
        $polite = ['thanks', 'thank you', 'thank', 'thx', 'ty', 'ok', 'okay', 'cool', 'nice', 'great', 'bye', 'goodbye'];

        if (in_array($text, $greetings, true) || in_array($text, $polite, true)) {
            return true;
        }

        $patterns = [
            '/^(hi|hello|hey)[\s!,.]*$/i',
            '/^how (are|is) (you|it going)/i',
            '/^(what\'?s up|sup|howdy)/i',
            '/^(good )?(morning|evening|afternoon|night)/i',
            '/^(thanks|thank you|thx|ty)[\s!.]*$/i',
            '/^(ok|okay|cool|nice|great|awesome)[\s!.]*$/i',
            '/^(bye|goodbye|see you|cya)[\s!.]*$/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
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
            return Landmark::orderByDesc('rating')->limit(15)->get();
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
            ->limit(15)
            ->get();

        if ($landmarks->isNotEmpty()) {
            return $landmarks;
        }

        return Landmark::orderByDesc('rating')->limit(15)->get();
    }

    private function findRelevantRestaurants(string $query): Collection
    {
        $query = trim($query);
        $terms = $this->extractSearchTerms($query);

        if ($terms === []) {
            return Restaurant::orderByDesc('rating')->limit(8)->get();
        }

        $restaurants = Restaurant::query()
            ->where(function ($builder) use ($terms) {
                foreach ($terms as $term) {
                    $builder->orWhere('name', 'like', '%' . $term . '%')
                        ->orWhere('region', 'like', '%' . $term . '%')
                        ->orWhere('category', 'like', '%' . $term . '%')
                        ->orWhere('description', 'like', '%' . $term . '%');
                }
            })
            ->orderByDesc('rating')
            ->limit(8)
            ->get();

        if ($restaurants->isNotEmpty()) {
            return $restaurants;
        }

        return Restaurant::orderByDesc('rating')->limit(8)->get();
    }

    private function findRelevantHotels(string $query): Collection
    {
        $query = trim($query);
        $terms = $this->extractSearchTerms($query);

        if ($terms === []) {
            return Hotel::orderByDesc('rating')->limit(8)->get();
        }

        $hotels = Hotel::query()
            ->where(function ($builder) use ($terms) {
                foreach ($terms as $term) {
                    $builder->orWhere('name', 'like', '%' . $term . '%')
                        ->orWhere('region', 'like', '%' . $term . '%')
                        ->orWhere('category', 'like', '%' . $term . '%')
                        ->orWhere('description', 'like', '%' . $term . '%')
                        ->orWhere('neighborhood', 'like', '%' . $term . '%');
                }
            })
            ->orderByDesc('rating')
            ->limit(8)
            ->get();

        if ($hotels->isNotEmpty()) {
            return $hotels;
        }

        return Hotel::orderByDesc('rating')->limit(8)->get();
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

    private function buildSuggestions(string $assistantContent, Collection $landmarks, Collection $restaurants, Collection $hotels): Collection
    {
        // Clean markdown formatting from AI text for better matching
        $clean = preg_replace('/[*#_•]+/u', ' ', $assistantContent);
        $clean = preg_replace('/\s+/u', ' ', $clean);
        $lowerContent = mb_strtolower(trim($clean));

        $nameWords = ['the', 'of', 'in', 'and', 'at', 'by', 'for', 'to', 'el', 'al', 'de', 'la'];

        $isMentionedInResponse = function ($name) use ($lowerContent, $nameWords): bool {
            $lowerName = mb_strtolower($name);
            // Exact phrase match first
            if (str_contains($lowerContent, $lowerName)) {
                return true;
            }
            // Word-level fallback: check if 70%+ of significant words appear
            $words = explode(' ', $lowerName);
            $significant = array_values(array_filter($words, fn ($w) => mb_strlen($w) >= 3 && !in_array($w, $nameWords, true)));
            if (empty($significant)) return false;
            $matched = 0;
            foreach ($significant as $w) {
                if (str_contains($lowerContent, $w)) $matched++;
            }
            return ($matched / count($significant)) >= 0.7;
        };

        // Match landmarks — first from the search results, then from full DB
        $matchedLandmarks = $landmarks->filter(fn ($l) => $isMentionedInResponse($l->name))->values();

        if ($matchedLandmarks->count() < 4) {
            // Search the full DB for any other mentioned landmarks
            $existingIds = $landmarks->pluck('id');
            Landmark::whereNotIn('id', $existingIds)->chunk(100, function ($chunk) use (&$matchedLandmarks, $isMentionedInResponse) {
                foreach ($chunk as $l) {
                    if ($isMentionedInResponse($l->name) && !$matchedLandmarks->contains('id', $l->id)) {
                        $matchedLandmarks->push($l);
                        if ($matchedLandmarks->count() >= 8) return false; // stop chunking
                    }
                }
            });
        }

        $mentionedLandmarkIds = $matchedLandmarks->take(8);

        // Region fallback if still nothing matched
        if ($mentionedLandmarkIds->isEmpty()) {
            $egyptRegions = ['cairo', 'giza', 'luxor', 'aswan', 'alexandria', 'hurghada',
                'sharm', 'dahab', 'el gouna', 'marsa alam', 'siwa', 'south sinai',
                'red sea', 'nile', 'zamalek', 'maadi', 'downtown', 'new cairo', 'nasr city'];
            $matchedRegion = null;
            foreach ($egyptRegions as $region) {
                if (str_contains($lowerContent, $region)) {
                    $matchedRegion = $region;
                    break;
                }
            }
            if ($matchedRegion) {
                $mentionedLandmarkIds = Landmark::where('region', 'like', '%' . $matchedRegion . '%')
                    ->orderByDesc('rating')->limit(6)->get();
            }
        }

        // Ultimate fallback
        if ($mentionedLandmarkIds->isEmpty()) {
            $mentionedLandmarkIds = $landmarks->take(6);
        }

        // Restaurants and hotels: only if mentioned in the response
        $mentionedRestaurants = $restaurants->filter(fn ($r) => $isMentionedInResponse($r->name))->take(3);
        $mentionedHotels = $hotels->filter(fn ($h) => $isMentionedInResponse($h->name))->take(3);

        return collect()
            ->concat($mentionedLandmarkIds->map(fn ($l) => [
                'type' => 'landmark',
                'id' => (string) $l->id,
                'name' => $l->name,
            ]))
            ->concat($mentionedRestaurants->map(fn ($r) => [
                'type' => 'restaurant',
                'id' => (string) $r->id,
                'name' => $r->name,
                'address' => $r->address,
                'maps_url' => $r->google_maps_url,
                'description' => Str::limit($r->description ?? '', 100),
            ]))
            ->concat($mentionedHotels->map(fn ($h) => [
                'type' => 'hotel',
                'id' => (string) $h->id,
                'name' => $h->name,
                'star_rating' => $h->star_rating,
                'address' => $h->address,
                'maps_url' => $h->google_maps_url,
                'phone' => $h->phone,
                'description' => Str::limit($h->description ?? '', 100),
            ]));
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

    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $query = AiConversation::withLastMessage();

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id');
            $guestId = $request->header('X-Guest-Id') ?? $request->query('guest_id');
            if ($guestId) {
                $currentId = $request->query('current_id');
                if ($currentId) {
                    $current = AiConversation::find($currentId);
                    if ($current && !$current->user_id && !in_array($currentId, $query->pluck('id')->toArray(), true)) {
                        if (!$current->guest_id) $current->update(['guest_id' => $guestId]);
                        $query->orWhere('id', $currentId);
                    }
                }
            }
        }

        $conversations = $query->orderByDesc('updated_at')->get();

        return response()->json([
            'data' => $conversations->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'last_message' => $c->last_message?->content ? Str::limit($c->last_message->content, 80) : null,
                'created_at' => $c->created_at,
                'updated_at' => $c->updated_at,
            ]),
        ]);
    }

    public function conversationMessages(Request $request, string $id): JsonResponse
    {
        $conv = AiConversation::find($id);

        if (!$conv) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ($conv->user_id && $conv->user_id !== $request->user()?->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$conv->user_id && $conv->guest_id && $conv->guest_id !== ($request->header('X-Guest-Id') ?? $request->query('guest_id'))) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $messages = $conv->messages()->orderBy('created_at')->get()->map(fn ($m) => [
            'role' => $m->role,
            'content' => $m->content,
        ]);

        return response()->json(['data' => $messages]);
    }

    public function destroyConversation(Request $request, string $id): JsonResponse
    {
        $conv = AiConversation::find($id);

        if (!$conv) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ($conv->user_id && $conv->user_id !== $request->user()?->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$conv->user_id && $conv->guest_id && $conv->guest_id !== ($request->header('X-Guest-Id') ?? $request->query('guest_id'))) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $conv->messages()->delete();
        $conv->delete();

        return response()->json(['message' => 'Conversation deleted.']);
    }
}
