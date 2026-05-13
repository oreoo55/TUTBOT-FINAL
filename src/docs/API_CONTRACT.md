
# TUTBOT — API Contract

Complete request/response reference for the Laravel backend.

- **Base URL**: `{API_BASE}/api` — e.g. `https://api.tutbot.com/api`
- **Auth**: Sanctum bearer tokens. Send `Authorization: Bearer <token>` on protected endpoints.
- **Format**: `Content-Type: application/json` for requests with body. All responses JSON.
- **Timestamps**: ISO 8601 UTC, e.g. `"2026-05-12T14:30:00Z"`.
- **IDs**: server primary keys serialized as **strings** to match frontend `Landmark.id: string`.

---

## Error Envelope

All non-2xx responses follow:

```json
{
  "message": "Human-readable description",
  "errors": {
    "field_name": ["Validation message"]
  }
}
```

Status codes the frontend handles specifically:

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| 400  | Bad request — generic client error                   |
| 401  | Not authenticated — frontend forces re-login         |
| 403  | Not authorized                                       |
| 404  | Resource not found — frontend shows empty state      |
| 422  | Validation error — frontend renders `errors.<field>` |
| 429  | Rate-limited — show toast and back off               |
| 500  | Server error — generic toast                         |

---

## Pagination Envelope

List endpoints use Laravel's paginator:

```json
{
  "data": [ /* array of resources */ ],
  "current_page": 1,
  "last_page": 7,
  "per_page": 20,
  "total": 137,
  "from": 1,
  "to": 20
}
```

Frontend passes `?page=N&per_page=20`.

---

## 1. Auth

### `POST /api/auth/register`

Public.

**Request**
```json
{ "name": "Alex Traveler", "email": "alex@example.com", "password": "********" }
```

**Response 201**
```json
{
  "token": "1|abc...",
  "user": { /* User object — see schema */ }
}
```

### `POST /api/auth/login`

Public.

**Request**
```json
{ "email": "alex@example.com", "password": "********" }
```

**Response 200**
```json
{
  "token": "1|abc...",
  "user": { /* User object */ }
}
```

### `POST /api/auth/logout`

Auth required. Revokes the current token.

**Response 204** (no body)

### `GET /api/me`

Auth required. Current user profile.

**Response 200**
```json
{
  "id": "1",
  "name": "Alex Traveler",
  "email": "alex@example.com",
  "avatar": "https://...",
  "level": 12,
  "xp": 2450,
  "next_level_xp": 3000,
  "location": "Cairo, Egypt",
  "bio": "Lover of pyramids.",
  "badges": [
    { "id": "b1", "name": "Pharaoh Explorer", "icon": "Crown", "description": "..." }
  ],
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## 2. Landmarks

### `GET /api/landmarks`

Public. Supports filters and pagination.

**Query parameters**

| Param      | Type     | Notes                                                          |
| ---------- | -------- | -------------------------------------------------------------- |
| `q`        | string   | Free-text search on name + description                         |
| `type`     | string   | `name` \| `region` \| `category` — scopes `q` to one field     |
| `region`   | string   | Filter by governorate name                                     |
| `category` | string   | One of `Archaeological`, `Museum`, `Religious`, `Recreational`, `Cultural` |
| `era`      | string   | Optional era filter                                            |
| `min_price`, `max_price` | number | EGP                                            |
| `outdoor`  | boolean  | If true, only outdoor sites                                    |
| `accessibility` | boolean | Wheelchair accessible only                                |
| `sort`     | string   | `rating` \| `price` \| `name` (suffix `-desc` for desc)        |
| `page`, `per_page` | number | Pagination                                            |

**Response 200** — paginated:

```json
{
  "data": [
    {
      "id": "44",
      "name": "Pyramids of Giza",
      "region": "Giza",
      "category": "Archaeological",
      "era": "Old Kingdom",
      "price": 240,
      "rating": 4.7,
      "reviews": 1850,
      "image": "https://images.unsplash.com/...",
      "fallback_image": "https://...",
      "panorama_url": "https://www.google.com/maps?q=&layer=c&cbll=...",
      "description": "...",
      "lat": 29.9792,
      "lng": 31.1342,
      "city": "Giza",
      "area": "Al Haram",
      "opening_hours": "8:00",
      "closing_hours": "17:00",
      "avg_visit_duration": 180,
      "accessibility_wheelchair": true,
      "is_outdoor": true,
      "best_day_visit": "Morning",
      "best_season": "Winter",
      "cost_level": "Luxury",
      "entrance_fee_egyptian": 240,
      "entrance_fee_egyptian_student": 120,
      "entrance_fee_foreigner": 700,
      "entrance_fee_foreigner_student": 350
    }
  ],
  "current_page": 1, "last_page": 6, "per_page": 20, "total": 115
}
```

**Important**: the frontend type uses camelCase but the API may return snake_case — the `lib/api.ts` wrapper converts. If you prefer, return camelCase directly; just be consistent.

### `GET /api/landmarks/{id}`

Public. Single landmark.

**Response 200**: same shape as one entry in `data[]` above, plus `reviews_preview` (first 3 reviews).

### `GET /api/landmarks/{id}/reviews`

Public. Paginated.

**Response 200**
```json
{
  "data": [
    {
      "id": "12",
      "user": { "id": "5", "name": "Sarah Jenkins", "avatar": "https://..." },
      "rating": 5,
      "text": "Amazing experience...",
      "created_at": "2026-04-12T10:30:00Z"
    }
  ],
  /* pagination */
}
```

### `POST /api/landmarks/{id}/reviews`

Auth required.

**Request**
```json
{ "rating": 5, "text": "Loved every minute." }
```

**Response 201**: the created review (same shape as above).

---

## 3. User Collections

All endpoints below require auth.

### `GET /api/me/favorites`

**Response 200**
```json
{ "data": [ /* Landmark[] */ ] }
```

### `POST /api/me/favorites`

**Request**
```json
{ "landmark_id": "44" }
```

**Response 201**
```json
{ "landmark": { /* Landmark */ } }
```

### `DELETE /api/me/favorites/{landmark_id}`

**Response 204** (no body)

### `GET /api/me/wishlist`
### `POST /api/me/wishlist`        — `{ "landmark_id": "..." }`
### `DELETE /api/me/wishlist/{landmark_id}`

Same shapes as favorites.

---

## 4. Bookings

All require auth.

### `POST /api/bookings`

**Request**
```json
{
  "landmark_id": "44",
  "booking_date": "2026-06-12",
  "adults": 2,
  "children": 1,
  "payment_method": "card",      // "card" | "mobile" | "qr" | "cash"
  "payer_details": {
    "name": "Alex Traveler",
    "email": "alex@example.com",
    "phone": "+201234567890"
  }
}
```

Pricing rules (server-side, do not trust client):
- `subtotal = adults * landmark.price + children * landmark.price * 0.5`
- `service_fee = landmark.price === 0 ? 0 : 50` (EGP)
- `total = landmark.price === 0 ? 0 : subtotal + service_fee`

**Response 201**
```json
{
  "id": "1043",
  "confirmation_code": "AB3FX9",
  "status": "confirmed",
  "landmark": { /* Landmark */ },
  "booking_date": "2026-06-12",
  "adults": 2,
  "children": 1,
  "subtotal": 480,
  "service_fee": 50,
  "total": 530,
  "currency": "EGP",
  "payment_method": "card",
  "payment_status": "paid",
  "qr_token": "opaque-token-for-qr-render",
  "created_at": "2026-05-12T14:30:00Z"
}
```

### `GET /api/me/bookings`

**Query**: `?status=current|previous|all` (default `all`)

**Response 200**: paginated list of bookings.

### `GET /api/bookings/{id}`

**Response 200**: same shape as POST response.

### `POST /api/bookings/{id}/cancel`

Refundable only if more than 24 hours before `booking_date`.

**Response 200**
```json
{ "id": "1043", "status": "cancelled", "refund": { "amount": 530, "eta_days": 5 } }
```

---

## 5. Community

### `GET /api/community/posts`

Public. Paginated.

**Query**: `?category=Archaeological&landmark_id=44&sort=recent|popular`

**Response 200**
```json
{
  "data": [
    {
      "id": "1",
      "traveler": { "id": "5", "name": "Omar Hassan", "avatar": "https://...", "level": 42, "badges_count": 18 },
      "landmark": { "id": "68", "name": "Luxor Temple" },     // optional
      "location": "Luxor Temple",
      "category": "Archaeological",
      "image": "https://...",
      "video_url": null,
      "excerpt": "Witnessing the sunset...",
      "likes": 342,
      "comments_count": 45,
      "liked_by_me": false,
      "created_at": "2026-05-10T18:30:00Z"
    }
  ],
  /* pagination */
}
```

### `POST /api/community/posts`

Auth required. `multipart/form-data` if uploading media, JSON otherwise.

**Request**
```json
{
  "text": "Just got back from Aswan!",
  "landmark_id": "90",           // optional
  "image": "<file>",             // optional, multipart
  "video_url": null              // optional
}
```

**Response 201**: the created post.

### `POST /api/community/posts/{id}/like`

Auth. Toggles like.

**Response 200**: `{ "likes": 343, "liked_by_me": true }`

### `GET /api/community/posts/{id}/comments`

Public. Paginated.

**Response 200**
```json
{
  "data": [
    {
      "id": "9",
      "user": { "id": "5", "name": "Sarah", "avatar": "..." },
      "is_ai": false,
      "text": "Beautiful shot!",
      "parent_id": null,
      "created_at": "2026-05-11T10:00:00Z"
    }
  ]
}
```

### `POST /api/community/posts/{id}/comments`

Auth.

**Request**: `{ "text": "...", "parent_id": null }`

**Response 201**: created comment.

### `GET /api/community/leaderboard`

Public.

**Response 200**
```json
{
  "data": [
    { "id": "1", "name": "Omar Hassan", "avatar": "https://...", "level": 42, "badges_count": 18 }
  ]
}
```

---

## 6. AI Proxy

### `POST /api/ai/chat`

Auth optional (guests allowed for the public chatbot).

**Request**
```json
{
  "conversation_id": null,
  "messages": [
    { "role": "user", "content": "Plan a 3-day budget trip in Cairo" }
  ],
  "context": {
    "current_landmark_id": null,
    "user_preferences": { "budget": "low", "interests": ["history"], "duration_days": 3 }
  }
}
```

**Response 200**
```json
{
  "conversation_id": "uuid",
  "message": {
    "role": "assistant",
    "content": "Here's a 3-day plan focused on Islamic Cairo and the Egyptian Museum...",
    "suggestions": [
      { "type": "landmark", "id": "1", "name": "Egyptian Museum" },
      { "type": "landmark", "id": "9", "name": "Khan El Khalili Bazaar" }
    ]
  }
}
```

See `docs/AI_INTEGRATION.md` for the full brief.

### `POST /api/ai/recommendations`

Auth optional.

**Request**
```json
{
  "user_id": "1",
  "context": { "budget": "moderate", "duration_days": 5, "interests": ["history", "beach"] },
  "limit": 6
}
```

**Response 200**
```json
{
  "data": [ /* Landmark[] sorted by relevance */ ]
}
```

---

## 7. Rate Limits (suggested)

| Endpoint family    | Limit                |
| ------------------ | -------------------- |
| Auth (login/register) | 5 req / min / IP  |
| AI chat            | 30 req / min / user  |
| Writes (bookings, posts, reviews) | 60 req / min / user |
| Reads              | 600 req / min / user |

Use Laravel's `throttle` middleware.
