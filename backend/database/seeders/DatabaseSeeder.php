<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            BadgeSeeder::class,
            LandmarkSeeder::class,
            RestaurantSeeder::class,
            HotelsSeeder::class,
            AdminUserSeeder::class,
            DemoUserSeeder::class,
        ]);
    }
}
