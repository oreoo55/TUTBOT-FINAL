<?php

namespace App\Http\Controllers;

use App\Models\Landmark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Landmark::query();

        if ($q = $request->query('q')) {
            $type = $request->query('type');
            if ($type === 'name') {
                $query->where('name', 'like', "%{$q}%");
            } elseif ($type === 'region') {
                $query->where('region', 'like', "%{$q}%");
            } elseif ($type === 'category') {
                $query->where('category', $q);
            } else {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            }
        }

        if ($region = $request->query('region')) {
            $query->where('region', $region);
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($era = $request->query('era')) {
            $query->where('era', $era);
        }

        if ($minPrice = $request->query('min_price')) {
            $query->where('price', '>=', (int) $minPrice);
        }

        if ($maxPrice = $request->query('max_price')) {
            $query->where('price', '<=', (int) $maxPrice);
        }

        if ($request->boolean('outdoor')) {
            $query->where('is_outdoor', true);
        }

        if ($request->boolean('accessibility')) {
            $query->where('accessibility_wheelchair', true);
        }

        $sort = $request->query('sort', 'name');
        if ($sort === 'rating') {
            $query->orderByDesc('rating');
        } elseif ($sort === 'rating-desc') {
            $query->orderByDesc('rating');
        } elseif ($sort === 'price') {
            $query->orderBy('price');
        } elseif ($sort === 'price-desc') {
            $query->orderByDesc('price');
        } elseif ($sort === 'name-desc') {
            $query->orderByDesc('name');
        } else {
            $query->orderBy('name');
        }

        $perPage = min((int) $request->query('per_page', 20), 500);
        $landmarks = $query->paginate($perPage);

        $landmarks->getCollection()->transform(fn($l) => $this->landmarkResponse($l));

        return response()->json($landmarks);
    }

    public function brief(): JsonResponse
    {
        $landmarks = Landmark::select('id', 'name')->orderBy('name')->get();

        return response()->json([
            'data' => $landmarks->map(fn ($l) => [
                'id' => (string) $l->id,
                'name' => $l->name,
            ]),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $landmark = Landmark::with('reviews.user')->findOrFail((int) $id);

        $response = $this->landmarkResponse($landmark);
        $response['reviews_preview'] = $landmark->reviews->take(3)->map(fn($r) => [
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

        return response()->json($response);
    }

    public static function landmarkResponse(Landmark $l): array
    {
        return [
            'id' => (string) $l->id,
            'name' => $l->name,
            'region' => $l->region,
            'city' => $l->city,
            'area' => $l->area,
            'category' => $l->category,
            'raw_category' => $l->raw_category,
            'era' => $l->era,
            'description' => $l->description,
            'image' => $l->image,
            'fallback_image' => $l->fallback_image,
            'panorama_url' => $l->panorama_url,
            'lat' => (float) $l->lat,
            'lng' => (float) $l->lng,
            'rating' => (float) $l->rating,
            'reviews' => $l->reviews_count,
            'price' => $l->price,
            'opening_hours' => $l->opening_hours,
            'closing_hours' => $l->closing_hours,
            'avg_visit_duration' => $l->avg_visit_duration,
            'accessibility_wheelchair' => $l->accessibility_wheelchair,
            'is_outdoor' => $l->is_outdoor,
            'best_day_visit' => $l->best_day_visit,
            'best_season' => $l->best_season,
            'cost_level' => $l->cost_level,
            'entrance_fee_egyptian' => $l->entrance_fee_egyptian,
            'entrance_fee_egyptian_student' => $l->entrance_fee_egyptian_student,
            'entrance_fee_foreigner' => $l->entrance_fee_foreigner,
            'entrance_fee_foreigner_student' => $l->entrance_fee_foreigner_student,
        ];
    }
}
