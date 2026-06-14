<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentVersion extends Model
{
    protected $primaryKey = 'content_type';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['content_type', 'updated_at'];

    protected function casts(): array
    {
        return [
            'updated_at' => 'datetime',
        ];
    }

    public static function bump(string $contentType): void
    {
        self::updateOrCreate(
            ['content_type' => $contentType],
            ['updated_at' => now()]
        );
    }

    public static function getAllVersions(): array
    {
        return self::all()->keyBy('content_type')->map->updated_at->toArray();
    }
}
