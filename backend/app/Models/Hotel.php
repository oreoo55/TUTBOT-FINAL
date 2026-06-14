<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    protected $fillable = [
        'name',
        'description',
        'address',
        'category',
        'star_rating',
        'price_level',
        'rating',
        'region',
        'neighborhood',
        'lat',
        'lng',
        'google_maps_url',
        'image',
        'phone',
        'website',
        'amenities',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
        ];
    }
}
