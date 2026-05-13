<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Landmark;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password123');

        $alex = User::create([
            'name' => 'Alex Traveler',
            'email' => 'alex@example.com',
            'password' => $password,
            'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            'level' => 12,
            'xp' => 2450,
            'next_level_xp' => 3000,
            'location' => 'Cairo, Egypt',
            'bio' => 'Passionate about Egyptian history and archaeology.',
        ]);

        $alex->badges()->attach(['b1', 'b2', 'b3'], ['earned_at' => now()]);
        $alex->favorites()->attach([44, 3]);
        $alex->wishlist()->attach([90, 114]);

        $users = [
            [
                'name' => 'Omar Hassan',
                'email' => 'omar@example.com',
                'level' => 42, 'xp' => 8400, 'next_level_xp' => 10000,
                'badges' => ['b1', 'b2', 'b3', 'b4', 'b6', 'b7', 'b8'],
                'favorites' => [44, 68, 69, 74, 82, 90],
                'avatar' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
                'location' => 'Alexandria, Egypt',
                'bio' => 'Travel blogger and photography enthusiast.',
            ],
            [
                'name' => 'Emma Watson',
                'email' => 'emma@example.com',
                'level' => 38, 'xp' => 7600, 'next_level_xp' => 9000,
                'badges' => ['b1', 'b4', 'b5', 'b6', 'b8'],
                'favorites' => [59, 67, 96, 104, 108],
                'avatar' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
                'location' => 'London, UK',
                'bio' => 'History lover exploring Egypt one landmark at a time.',
            ],
            [
                'name' => 'Liam Chen',
                'email' => 'liam@example.com',
                'level' => 35, 'xp' => 7000, 'next_level_xp' => 8500,
                'badges' => ['b1', 'b2', 'b3', 'b8'],
                'favorites' => [114, 113, 29, 7, 14],
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
                'location' => 'Toronto, Canada',
                'bio' => 'Adventure seeker and nature lover.',
            ],
            [
                'name' => 'Sophia Patel',
                'email' => 'sophia@example.com',
                'level' => 31, 'xp' => 6200, 'next_level_xp' => 7500,
                'badges' => ['b1', 'b4', 'b6', 'b7'],
                'favorites' => [1, 16, 24, 68, 70, 85],
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
                'location' => 'Mumbai, India',
                'bio' => 'Museum curator on a quest to see every Egyptian museum.',
            ],
            [
                'name' => 'Noah Smith',
                'email' => 'noah@example.com',
                'level' => 28, 'xp' => 5600, 'next_level_xp' => 7000,
                'badges' => ['b1', 'b5', 'b8'],
                'favorites' => [96, 97, 100, 104, 107],
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
                'location' => 'Sydney, Australia',
                'bio' => 'Diving and beach enthusiast.',
            ],
        ];

        foreach ($users as $data) {
            $badgeIds = $data['badges'];
            $favIds = $data['favorites'];
            unset($data['badges'], $data['favorites']);

            $user = User::create(array_merge($data, [
                'password' => $password,
                'next_level_xp' => $data['next_level_xp'],
            ]));

            $user->badges()->attach($badgeIds, ['earned_at' => now()]);
            $user->favorites()->attach($favIds);
        }

        $reviewers = [
            ['name' => 'Sarah Jenkins', 'email' => 'sarah@example.com', 'location' => 'London, UK'],
            ['name' => 'Michael Chen', 'email' => 'michael.c@example.com', 'location' => 'Toronto, Canada'],
            ['name' => 'Elena Rossi', 'email' => 'elena@example.com', 'location' => 'Rome, Italy'],
            ['name' => 'David Smith', 'email' => 'david.s@example.com', 'location' => 'Sydney, Australia'],
        ];

        foreach ($reviewers as $data) {
            User::create(array_merge($data, [
                'password' => $password,
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($data['name']) . '&background=D4AF37&color=fff',
                'level' => 1,
                'xp' => 0,
                'next_level_xp' => 100,
            ]));
        }
    }
}
