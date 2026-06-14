
# TUTBOT — Project Documentation

A modern React + Laravel full-stack app for discovering Egyptian landmarks, planning trips with an AI assistant (TutBot), booking tickets with QR codes, and engaging with a traveler community — with real-time content sync and a polished AI chat experience.

---

## 0. Quick Start for Collaborators

If you just downloaded/cloned this project, follow these steps to get it running:

### 1. Prerequisites
- **Node.js** (v18+)
- **PHP** (v8.2+) & **Composer**
- **MySQL** (XAMPP/Laragon/Local install)

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start dev server
npm run dev
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
composer install

# Create environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Start Laravel server
php artisan serve
```

### 4. Database Setup
1. Create a MySQL database named `tutbot`.
2. Configure your database credentials in `backend/.env`.
3. Run migrations:
```bash
php artisan migrate
```
4. (Optional) Import seed data:
```bash
mysql -u root -p tutbot < backend/database/dump.sql
```
5. (Optional) Seed additional data:
```bash
php artisan db:seed
```

---

This README is the **entry point for backend (PHP/Laravel + MySQL) and AI developers**. Detailed contracts live in the `docs/` folder.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Frontend ↔ Backend Contract](#4-frontend--backend-contract)
5. [For Backend Developers (Laravel + MySQL)](#5-for-backend-developers-laravel--mysql)
6. [For AI Developers](#6-for-ai-developers)
7. [Reference Files in This Repo](#7-reference-files-in-this-repo)
8. [Boundaries — What Must Not Change](#8-boundaries--what-must-not-change)
9. [Design Tokens](#9-design-tokens)

---

## 1. Architecture Overview

```
┌────────────────────┐      HTTPS / JSON      ┌────────────────────┐
│   React Frontend   │ ─────────────────────► │  Laravel API       │
│   (this repo)      │ ◄───────────────────── │  Sanctum auth      │
│   Vite + TS        │                        │  MySQL             │
└─────────┬──────────┘                        └─────────┬──────────┘
          │                                             │
          │ chat / recommendations                      │ stores prompts,
          ▼                                             ▼ user prefs
┌────────────────────┐                        ┌────────────────────┐
│  AI Service        │ ◄──── tool calls ───── │  AI Service        │
│  (Tut-Assistant)   │                        │  proxy / cache     │
│  LLM provider      │                        │  in Laravel        │
└────────────────────┘                        └────────────────────┘
```

- **Frontend** is purely presentation + client state. All persistence is server-side.
- **Backend** owns auth, data, bookings, community, badges, and acts as a proxy/cache to the AI service so API keys never reach the browser.
- **AI service** is invoked through the backend (`POST /api/ai/chat`) — never directly from the frontend.

---

## 2. Tech Stack

### Project Structure
This repository contains both the frontend and the backend:

```
/
├── backend/                      # Laravel 11 API
│   ├── .env.example              # Backend environment template
│   ├── app/, routes/, ...        # Laravel source
│   └── database/
│       └── dump.sql              # MySQL database dump
│
├── src/                          # React Frontend source
│   ├── .env.example              # Frontend environment template
│   ├── components/
│   ├── pages/
│   └── ...
│
├── .env.example                  # Root environment template (legacy)
├── .gitignore
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

### Frontend
- React 18 + TypeScript + React Router v6
- Tailwind CSS (with dark mode via `class` strategy)
- Framer Motion for animation
- Lucide React for icons
- **Real-time content polling** via `useContentPolling` hook (15s interval, instant on tab focus)

### Backend
- PHP 8.2+
- Laravel 11+ with Sanctum (token auth)
- MySQL 8+
- `ContentVersion` model for tracking content changes (used by polling)
- Optional: Redis for queue/cache
- Optional: S3 (or local disk) for user-uploaded images/videos

### AI (Laravel-resident proxy)
- OpenRouter API (any provider) — routed through `POST /api/ai/chat`
- Conversations persisted in DB with guest support
- Exposed to frontend ONLY through Laravel proxy endpoints

---

## 3. Repository Layout

This repository contains both the frontend and the backend:

```
/
├── backend/                      # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/     # API controllers (landmarks, bookings, AI, community, content versions)
│   │   ├── Models/               # Eloquent models (incl. ContentVersion, Hotel, Restaurant)
│   │   └── ...
│   ├── database/
│   │   ├── migrations/           # Laravel migrations (incl. hotels, restaurants, content versions, guest_id)
│   │   ├── seeders/              # Database seeders
│   │   └── dump.sql              # MySQL database dump
│   └── routes/api.php            # API route definitions
│
├── src/                          # React Frontend source
│   ├── components/               # Reusable UI (AIAssistant, LandmarkCard, NotificationBell, etc.)
│   ├── contexts/                 # Theme & User state
│   ├── data/                     # Seed datasets
│   ├── pages/                    # Main route components (Discover, LandmarkDetail, Community, etc.)
│   ├── lib/
│   │   ├── api.ts                # Thin fetch wrapper with auth
│   │   ├── types.ts              # TypeScript types matching API responses
│   │   ├── pdfTicket.ts          # PDF ticket generator
│   │   └── useContentPolling.ts  # Real-time content polling hook
│   └── .env.example              # Frontend environment template
│
├── docs/                         # Specifications & DB schema
├── .gitignore
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

---

## 4. Frontend ↔ Backend Contract

- **Base URL** comes from `VITE_API_URL` (see `.env.example`).
- **Auth**: Laravel Sanctum bearer tokens. The frontend sends `Authorization: Bearer <token>` on every authenticated request. Tokens are stored in `localStorage` under `tutbot.token`.
- **Format**: JSON in, JSON out. All timestamps are ISO 8601 UTC.
- **Errors**: standardized envelope:

```json
{
  "message": "Human-readable message",
  "errors": { "field": ["Validation error"] }   // optional, on 422
}
```

- **Pagination** (list endpoints): Laravel default paginator —
  `{ data: [...], current_page, last_page, per_page, total }`.
- **CORS**: backend must allow the frontend origin and `Authorization` header.

See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for every endpoint's request, response, status codes, and example payloads.

The TypeScript shapes the frontend expects are in [`lib/types.ts`](lib/types.ts) — treat this file as the source of truth for response models.

---

## 5. For Backend Developers (Laravel + MySQL)

### Quick start checklist

1. **Bootstrap** a fresh Laravel 11 project in a separate folder.
2. **Install Sanctum**: `composer require laravel/sanctum`, publish & migrate.
3. **Run the schema**: copy `docs/DATABASE_SCHEMA.sql` into a migration or run it directly. The schema is intentionally close to Laravel migration defaults (snake_case, plural tables, `id` bigint, `created_at`/`updated_at`).
4. **Seed landmarks**: import the dataset from this repo's `data/mockData.ts` (`rawPlaces` array — 115 records) into the `landmarks` table. Field mapping is documented in `docs/API_CONTRACT.md`.
5. **Implement endpoints** following `docs/API_CONTRACT.md`. Start with auth → landmarks → bookings → community → AI proxy.
6. **CORS**: in `config/cors.php`, allow `paths => ['api/*']`, `allowed_origins => [env('FRONTEND_URL')]`, `supports_credentials => false`.
7. **Storage**: configure S3 or local disk for user uploads (post images, avatars).

### Key data shapes the frontend expects

The frontend's `Landmark` type (see `lib/types.ts`) flattens the rich place data:

```ts
{
  id: string,           // server primary key as string
  name: string,
  region: string,       // governorate name
  category: string,     // display category — "Archaeological" | "Museum" | "Religious" | "Recreational" | "Cultural"
  era: string,
  price: number,        // EGP, Egyptian adult fare
  rating: number,
  reviews: number,      // review count
  image: string,        // full URL
  description: string,
  lat: number,
  lng: number,
  // extended:
  city, area, openingHours, closingHours, avgVisitDuration,
  accessibilityWheelchair, isOutdoor, bestDayVisit, bestSeason,
  costLevel, entranceFeeEgyptian, entranceFeeEgyptianStudent,
  entranceFeeForeigner, entranceFeeForeignerStudent,
  panoramaUrl,          // Google Street View embed URL
  fallbackImage         // backup image URL
}
```

### Critical implementation notes

- **Booking confirmation code**: 6-character alphanumeric, uppercase, unique per booking. Generated server-side.
- **QR payload**: backend generates an opaque token bound to the booking; do NOT expose raw IDs.
- **Refund window**: 24 hours before `booking_date` for standard tickets — encode this rule server-side.
- **Badges**: awarded by background jobs after triggering events (e.g. `BookingCompleted`, `ReviewCreated`).
- **Search**: support `?q=`, `?type=name|region|category`, `?region=`, `?category=`. Use MySQL full-text on `name`+`description` for `q`.
- **Image hosting**: existing dataset uses Unsplash URLs — keep them for seeded landmarks. Only host user-uploaded media.

See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the full endpoint reference.
See [`docs/DATABASE_SCHEMA.sql`](docs/DATABASE_SCHEMA.sql) for the schema you can drop into MySQL or convert to migrations.

---

## 6. For AI Developers

The product has two AI-powered surfaces today:

1. **Tut-Assistant** — a floating chatbot (see `components/AIAssistant.tsx`). It currently uses hardcoded keyword routing. You replace it with a real LLM call routed through Laravel.
2. **Personalized recommendations** — implicit in the "Discover" page and trip planning. The user expects suggestions tuned to budget, interests, duration, and family situation.

### Frontend expectation (Tut-Assistant)

The frontend will POST chat turns to `/api/ai/chat` and stream or batch the response back. The contract:

```http
POST /api/ai/chat
Authorization: Bearer <token>   // optional — guests allowed
Content-Type: application/json

{
  "conversation_id": "uuid-or-null",
  "messages": [
    { "role": "user", "content": "I want a 5-day budget trip from Cairo to Luxor" }
  ],
  "context": {
    "current_landmark_id": "44",
    "user_preferences": { "budget": "moderate", "interests": ["history"] }
  }
}
```

Response:

```json
{
  "conversation_id": "uuid",
  "message": {
    "role": "assistant",
    "content": "...",
    "suggestions": [ /* optional structured suggestions */ ]
  }
}
```

### What you own

- **Prompt engineering** for an Egyptologist + travel-agent persona.
- **Tool calling** so the model can look up landmarks (`landmarkLookup`), check booking availability, fetch the user's wishlist, etc. — these tools call your Laravel API server-side.
- **Recommendation logic** (rule-based, embeddings, or full RAG). Cache results aggressively.
- **Safety**: profanity filtering, refusal for unrelated topics, no hallucinated prices.

### What the frontend will NOT do

- Frontend will not call OpenAI / Anthropic / etc. directly.
- Frontend will not store prompts or API keys.

See [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md) for the full brief — sample prompts, tool schemas, evaluation cases.

---

## 7. Reference Files in This Repo

These files are intended specifically to make integration easier:

| File                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `lib/api.ts`                  | Thin fetch wrapper. Reads `VITE_API_URL`, attaches bearer token.        |
| `lib/types.ts`                | TypeScript types matching every API response. Backend treats as source. |
| `lib/useContentPolling.ts`    | Real-time polling hook — checks content versions every 15s.            |
| `lib/pdfTicket.ts`            | Client-side PDF ticket generator for booking confirmation.              |
| `docs/API_CONTRACT.md`        | Full endpoint catalogue with request/response examples.                 |
| `docs/DATABASE_SCHEMA.sql`    | Runnable MySQL DDL — ready to import or convert to Laravel migrations.  |
| `docs/AI_INTEGRATION.md`      | Tut-Assistant + recommendation brief, prompt scaffolding, tool schemas. |
| `.env.example`                | Environment variables required by the frontend.                         |
| `data/mockData.ts`            | 115-landmark seed dataset. Use to populate the `landmarks` table.       |

---

## 8. Boundaries — What Must Not Change

When asking an AI agent to build the Laravel backend, paste this verbatim:

> Only generate Laravel files in `/backend/` (a separate folder). Do NOT modify anything in `/components/`, `/pages/`, `/contexts/`, `/data/`, `/lib/`, `App.tsx`, `index.tsx`, `index.css`, or `tailwind.config.js`. The frontend is React and stays React. You may read `docs/API_CONTRACT.md`, `docs/DATABASE_SCHEMA.sql`, `docs/AI_INTEGRATION.md`, and `lib/types.ts` as reference but never rewrite them as PHP.

Specifically forbidden:

- ❌ Converting `.tsx` files to `.blade.php`
- ❌ Replacing React Router with Laravel routes
- ❌ Editing Tailwind config or `index.css`
- ❌ Deleting `data/mockData.ts` (used as fallback during migration)
- ❌ Adding `composer.json`, `artisan`, or `vendor/` to this folder

---

## 9. Design Tokens

Defined in `tailwind.config.js` and `index.css`:

- `navy` — `#0F172A` — primary text in light mode
- `royal` — `#1E3A8A` — primary accent in light mode
- `gold` — `#D4AF37` — accent (heavily used in dark mode and CTAs)
- `sand` — `#F3EFE6` — light surface neutral
- `offwhite` — `#FAFAF7` — base background
- `midnight` — `#0B1120` — base background in dark mode
- `slate.card` — `#1A2236` — elevated surface (dark)
- `slate.border` — `#243049` — dividers (dark)

Dark mode is enabled via the `class` strategy — `<html class="dark">` is toggled by `contexts/ThemeContext.tsx`.

---

Built with care. The API is the contract — keep frontend, backend, and AI service in clean, separate boundaries.
