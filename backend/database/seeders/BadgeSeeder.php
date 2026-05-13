<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            [
                'id' => 'b1',
                'name' => 'Pharaoh Explorer',
                'description' => 'Visited 5+ archaeological sites',
                'icon' => 'Crown',
                'criteria' => ['type' => 'visit_count', 'category' => 'Archaeological', 'count' => 5],
            ],
            [
                'id' => 'b2',
                'name' => 'Nile Wanderer',
                'description' => 'Took a Nile cruise',
                'icon' => 'Waves',
                'criteria' => ['type' => 'custom', 'description' => 'Book a Nile cruise'],
            ],
            [
                'id' => 'b3',
                'name' => 'Desert Nomad',
                'description' => 'Visited Siwa or White Desert',
                'icon' => 'Sun',
                'criteria' => ['type' => 'custom', 'description' => 'Visit a desert oasis'],
            ],
            [
                'id' => 'b4',
                'name' => 'Temple Runner',
                'description' => 'Visited 10+ temples',
                'icon' => 'Landmark',
                'criteria' => ['type' => 'visit_count', 'category' => 'Archaeological', 'count' => 10],
            ],
            [
                'id' => 'b5',
                'name' => 'Beach Lover',
                'description' => 'Visited 3+ beaches',
                'icon' => 'Umbrella',
                'criteria' => ['type' => 'visit_count', 'category' => 'beach', 'count' => 3],
            ],
            [
                'id' => 'b6',
                'name' => 'Museum Buff',
                'description' => 'Visited 5+ museums',
                'icon' => 'BookOpen',
                'criteria' => ['type' => 'visit_count', 'category' => 'Museum', 'count' => 5],
            ],
            [
                'id' => 'b7',
                'name' => 'Culture Seeker',
                'description' => 'Visited 3+ cultural landmarks',
                'icon' => 'Globe',
                'criteria' => ['type' => 'visit_count', 'category' => 'Cultural', 'count' => 3],
            ],
            [
                'id' => 'b8',
                'name' => 'Globetrotter',
                'description' => 'Visited landmarks in 4+ governorates',
                'icon' => 'Compass',
                'criteria' => ['type' => 'region_count', 'count' => 4],
            ],
        ];

        foreach ($badges as $b) {
            Badge::create($b);
        }
    }
}
