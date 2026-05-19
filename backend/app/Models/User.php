<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'level',
        'xp',
        'next_level_xp',
        'location',
        'bio',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Landmark::class, 'favorites')->withTimestamps();
    }

    public function wishlist(): BelongsToMany
    {
        return $this->belongsToMany(Landmark::class, 'wishlist')->withTimestamps();
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')->withPivot('earned_at');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function addXp(int $amount): void
    {
        $this->increment('xp', $amount);

        $iterations = 0;
        while ($this->xp >= $this->next_level_xp && $this->next_level_xp > 0 && $iterations < 100) {
            $this->xp -= $this->next_level_xp;
            $this->level++;
            $this->next_level_xp = (int) (100 * pow(2, $this->level - 1));
            $iterations++;
        }

        if ($this->next_level_xp <= 0) {
            $this->next_level_xp = 500;
        }

        $this->save();
    }

    public function checkBadges(): array
    {
        $earned = [];

        $badges = Badge::all();
        $existingIds = $this->badges()->pluck('badge_id')->toArray();

        foreach ($badges as $badge) {
            if (in_array($badge->id, $existingIds)) {
                continue;
            }

            $unlocked = false;

            if ($badge->criteria && isset($badge->criteria['type'])) {
                $type = $badge->criteria['type'];

                if ($type === 'visit_count') {
                    $category = $badge->criteria['category'] ?? null;
                    $count = $badge->criteria['count'] ?? 1;
                    $query = $this->bookings()->whereIn('status', ['confirmed', 'completed']);

                    if ($category) {
                        $query->whereHas('landmark', fn($q) => $q->where('category', $category));
                    }

                    $unlocked = $query->count() >= $count;
                } elseif ($type === 'region_count') {
                    $count = $badge->criteria['count'] ?? 1;
                    $regions = $this->bookings()
                        ->whereIn('status', ['confirmed', 'completed'])
                        ->whereHas('landmark')
                        ->with('landmark')
                        ->get()
                        ->pluck('landmark.region')
                        ->unique()
                        ->filter()
                        ->count();

                    $unlocked = $regions >= $count;
                } elseif ($type === 'custom') {
                    $desc = $badge->criteria['description'] ?? '';
                    if (str_contains($desc, 'Book a Nile cruise')) {
                        $unlocked = $this->bookings()
                            ->whereIn('status', ['confirmed', 'completed'])
                            ->whereHas('landmark', fn($q) => $q->where('name', 'like', '%Nile%'))
                            ->exists();
                    } elseif (str_contains($desc, 'Visit a desert oasis')) {
                        $unlocked = $this->bookings()
                            ->whereIn('status', ['confirmed', 'completed'])
                            ->whereHas('landmark', fn($q) => $q->where('category', 'Natural')->orWhere('name', 'like', '%Oasis%')->orWhere('name', 'like', '%Desert%'))
                            ->exists();
                    }
                }
            }

            if ($unlocked) {
                $this->badges()->attach($badge->id, ['earned_at' => now()]);
                $earned[] = $badge->name;
            }
        }

        return $earned;
    }
}
