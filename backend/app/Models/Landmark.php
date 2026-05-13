<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Landmark extends Model
{
    protected $fillable = [
        'name', 'region', 'city', 'area', 'category', 'raw_category', 'era',
        'description', 'image', 'fallback_image', 'panorama_url',
        'lat', 'lng', 'rating', 'reviews_count', 'price',
        'opening_hours', 'closing_hours', 'avg_visit_duration',
        'accessibility_wheelchair', 'is_outdoor', 'best_day_visit', 'best_season',
        'cost_level', 'entrance_fee_egyptian', 'entrance_fee_egyptian_student',
        'entrance_fee_foreigner', 'entrance_fee_foreigner_student',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'accessibility_wheelchair' => 'boolean',
            'is_outdoor' => 'boolean',
        ];
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites');
    }

    public function wishlistedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wishlist');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
