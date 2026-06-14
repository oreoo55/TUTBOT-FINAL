<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    protected $fillable = [
        'name',
        'description',
        'address',
        'category',
        'price_level',
        'rating',
        'region',
        'lat',
        'lng',
        'google_maps_url',
        'image',
        'phone',
        'opening_hours',
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
