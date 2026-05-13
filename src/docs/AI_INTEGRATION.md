
# TUTBOT — AI Integration Brief

This document is for the engineer building the AI features:
1. **Tut-Assistant** — the floating chatbot (`components/AIAssistant.tsx`)
2. **Personalized recommendations** — `/api/ai/recommendations`

The frontend already has UI for both. Your job is to replace the current placeholder logic with real LLM-powered responses served through the Laravel backend.

---

## 1. Architectural Rules

- ❗ **The frontend MUST NOT call any LLM provider directly.** No API keys in the browser.
- All AI requests are routed through Laravel:
  - `POST /api/ai/chat`
  - `POST /api/ai/recommendations`
- The backend holds provider credentials, runs prompts, calls tools (which read the MySQL DB), and returns sanitized responses.
- Conversation history is persisted in `ai_conversations` / `ai_messages` tables (see `docs/DATABASE_SCHEMA.sql`).

---

## 2. Tut-Assistant — Conversational Agent

### Persona

> You are **Tut-Assistant**, an Egyptologist and a friendly Egyptian travel agent. You help travelers plan trips, choose landmarks, manage budgets, and book tickets across Egypt. Speak warmly. Use British or American English consistently. Be concise — short paragraphs and short lists. Never invent prices, hours, or facts about landmarks not in the database; instead call the `landmark_lookup` tool.

### System prompt scaffold

```
You are Tut-Assistant for TUTBOT, an Egypt travel platform.

You can help with:
- Suggesting landmarks based on budget, interests, dates, group composition
- Building day-by-day itineraries
- Explaining historical / cultural context
- Helping the user book a ticket (you cannot complete bookings — direct them to the booking page)
- Answering questions about the user's saved favorites, wishlist, and trips

Hard constraints:
- Never state a price, opening time, or fact about a landmark unless it came from a `landmark_lookup` tool call in this conversation.
- If the user asks something unrelated to Egypt travel, politely steer back.
- Currency is EGP unless the user specifies otherwise.
- If the user is unauthenticated and asks about "my" data, suggest they sign in.
```

### Tool schemas (JSON Schema-style)

The backend exposes these tools to the LLM. Each tool maps to an internal Laravel service call — they do not require user-facing endpoints.

#### `landmark_lookup`
Search the landmarks dataset.
```json
{
  "name": "landmark_lookup",
  "description": "Search Egyptian landmarks by name, region, or category.",
  "parameters": {
    "type": "object",
    "properties": {
      "query":    { "type": "string" },
      "region":   { "type": "string" },
      "category": { "enum": ["Archaeological","Museum","Religious","Recreational","Cultural"] },
      "max_price": { "type": "integer", "description": "Max entrance fee in EGP" },
      "limit":    { "type": "integer", "default": 6 }
    }
  }
}
```
Returns: `{ "results": Landmark[] }`

#### `user_collections`
Inspect the signed-in user's data.
```json
{
  "name": "user_collections",
  "parameters": {
    "type": "object",
    "properties": {
      "kind": { "enum": ["favorites","wishlist","current_trips","previous_trips","badges"] }
    },
    "required": ["kind"]
  }
}
```
Returns: `{ "items": Landmark[] | Booking[] | Badge[] }`. If guest, return `{ "error": "unauthenticated" }`.

#### `build_itinerary`
Optional structured response helper.
```json
{
  "name": "build_itinerary",
  "parameters": {
    "type": "object",
    "properties": {
      "days": { "type": "integer", "minimum": 1, "maximum": 21 },
      "budget_egp": { "type": "integer" },
      "interests": { "type": "array", "items": { "type": "string" } },
      "start_region": { "type": "string" }
    },
    "required": ["days"]
  }
}
```
Returns an array of `{ day, morning, afternoon, evening, est_cost_egp }`.

### Response shape

The frontend expects:

```json
{
  "conversation_id": "uuid",
  "message": {
    "role": "assistant",
    "content": "string — markdown lite OK (no raw HTML)",
    "suggestions": [
      { "type": "landmark", "id": "44", "name": "Pyramids of Giza" },
      { "type": "action",   "id": "open_booking", "landmark_id": "44" }
    ]
  }
}
```

`suggestions` is optional — if present, the frontend renders quick-action chips below the assistant bubble.

### Streaming (optional)

If you support SSE streaming, the frontend can be upgraded to consume it. For v1, plain JSON responses are fine.

---

## 3. Recommendation Engine

`POST /api/ai/recommendations` returns landmarks tailored to a user.

Input:
```json
{
  "user_id": "1",
  "context": {
    "budget": "low|moderate|luxury",
    "duration_days": 5,
    "interests": ["history","beach","food"],
    "season": "winter",
    "group": "family|solo|romantic|adventure"
  },
  "limit": 6
}
```

Strategies you can ship in stages:

1. **v0 (rule-based)** — filter by `cost_level`, `category`, `best_season`. Boost by `rating`. Good enough for launch.
2. **v1 (collaborative)** — recommend landmarks favorited or wishlisted by similar users (Jaccard / cosine on user-landmark matrix).
3. **v2 (embeddings)** — embed each landmark's `description` + tags; embed user's interests; rank by cosine similarity. Cache embeddings in a `landmark_embeddings` table.

Output is just a list of `Landmark` objects in ranked order — the frontend already knows how to render them.

---

## 4. Safety & Guardrails

- **Profanity filter** on user input — reject or sanitize.
- **Off-topic refusal** — if the user asks about politics, religion debates, medical advice, etc., respond with a friendly redirect.
- **Hallucination guard** — every numeric claim (price, opening hours, distances) must trace to a `landmark_lookup` result in the same turn. Add a post-processing check that scans the assistant's reply for `\b\d+ EGP\b` patterns and verifies they appear in the latest tool response.
- **PII** — never echo back the user's email, phone, or payment info.
- **Rate limiting** — 30 requests/min/user. Return 429 on overflow.

---

## 5. Evaluation Cases

Keep these as a regression set:

| User input                                              | Expected behavior                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| "Plan a 3-day budget trip in Cairo"                      | Calls `landmark_lookup(region='Cairo', max_price=100)`. Returns a 3-day plan with cheap/free sites. |
| "How much is the Pyramids ticket?"                       | Calls `landmark_lookup(query='Pyramids of Giza')`. Quotes EGP fees for Egyptian vs foreigner, citing the tool. |
| "What's my wishlist?" (logged in)                        | Calls `user_collections(kind='wishlist')`. Lists names + brief blurbs. |
| "What's my wishlist?" (guest)                            | Politely asks the user to sign in.                                  |
| "Tell me about Egyptian politics"                        | Refuses, redirects to travel.                                       |
| "Best beach for diving"                                  | Suggests Dahab Blue Hole, Sharm — confirms via tool first.          |
| Garbage input ("asdf qwerty")                            | Asks for clarification.                                             |

---

## 6. Logging

Persist every turn into `ai_messages`. Useful columns:
- `conversation_id` (UUID)
- `role`
- `content`
- `tool_calls` (JSON)
- `tokens` (for cost tracking)
- `created_at`

Build a small admin view to inspect conversations, especially flagged ones (high refusal rate, profanity hits, low star feedback).

---

## 7. Frontend Hook (for reference)

Once the backend is live, replace the keyword logic in `components/AIAssistant.tsx`'s `handleSend` with:

```ts
import { api } from '../lib/api'

const res = await api.post('/ai/chat', {
  conversation_id: conversationId,
  messages: messagesForServer,
  context: { user_preferences: prefs },
})
setConversationId(res.conversation_id)
setMessages((prev) => [...prev, res.message])
```

The frontend already has the chat UI, message bubbles, and loading states wired up.
