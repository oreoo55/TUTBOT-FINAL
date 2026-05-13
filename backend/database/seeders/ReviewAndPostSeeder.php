<?php

namespace Database\Seeders;

use App\Models\Landmark;
use App\Models\Post;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewAndPostSeeder extends Seeder
{
    private array $reviewTexts = [
        'Absolutely breathtaking! A must-visit for anyone traveling to Egypt.',
        'The history here is incredible. Spent hours exploring every corner.',
        'Beautiful site, though it gets very crowded by midday. Go early!',
        'Our guide was fantastic and brought the stories to life.',
        'Well preserved and easy to explore. The entrance fee is very reasonable.',
        'A hidden gem! Not as crowded as some other sites, but just as impressive.',
        'The architecture is mind-blowing. You can feel the history in the air.',
        'Great for photos, especially during golden hour. Bring your camera!',
        'Fascinating place with so much to learn. The audio guide is worth it.',
        'One of the best experiences of my trip. Highly recommend.',
        'Peaceful and beautiful. Perfect for a quiet afternoon of exploration.',
        'The details in the carvings are amazing. Take your time to appreciate them.',
        'Worth every penny. The preservation work being done here is commendable.',
        'Visited with family and everyone loved it. Very accessible site.',
        'Stunning views! The location alone is worth the visit.',
    ];

    private array $postTexts = [
        'Just arrived in Egypt and I am already blown away by the hospitality! The food, the people, the atmosphere — everything is incredible. Can\'t wait to explore more.',
        'Spent the day exploring ancient temples and felt like I stepped back in time. The hieroglyphics are so detailed and well preserved. What an experience!',
        'Best falafel I have ever had! Found this tiny spot near the market and it was absolutely delicious. Street food in Egypt is unmatched.',
        'Sunset over the Nile is something everyone should experience at least once. The way the light hits the water is pure magic.',
        'Hot air balloon ride at dawn over the Valley of the Kings! The view from above is surreal. Highly recommend this to anyone visiting Luxor.',
        'Made some amazing friends at the hostel today. We ended up exploring the city together and had the best time. Travel truly brings people together.',
        'The local market is a treasure trove of handmade crafts, spices, and textiles. Bargaining is half the fun! Got some beautiful souvenirs.',
        'Desert safari was incredible! Sandboarding, camel riding, and watching the sunset from the dunes. Unforgettable day.',
        'Visited a Nubian village today and learned so much about their culture and traditions. The colors, the music, the warmth of the people — absolutely wonderful.',
        'Tried kushari for the first time and I am hooked! Such a simple yet delicious dish. Going back for seconds tomorrow.',
        'The sound and light show at the temple was spectacular. The stories told through lights and narration made the history come alive.',
        'Found the perfect spot to watch the sunrise over the city. Egypt never ceases to amaze me. Every morning brings something new.',
        'Learning to cook traditional Egyptian food today! Taking a cooking class and it is so much fun. Hope I can recreate these dishes at home.',
        'The Red Sea is unreal! The clearest water I have ever seen. Snorkeling was like swimming in an aquarium.',
        'Walking through the old city streets feels like stepping into a different era. Every alley has a story to tell.',
    ];

    public function run(): void
    {
        $users = User::where('is_admin', false)->get();
        $landmarks = Landmark::all();

        if ($users->isEmpty() || $landmarks->isEmpty()) {
            return;
        }

        // ─── 1 review per landmark ─────────────────────────────────
        foreach ($landmarks as $landmark) {
            $user = $users->random();
            $rating = rand(3, 5);

            Review::create([
                'user_id' => $user->id,
                'landmark_id' => $landmark->id,
                'rating' => $rating,
                'text' => $this->reviewTexts[array_rand($this->reviewTexts)],
            ]);
        }

        // Recalculate landmark stats
        foreach ($landmarks as $landmark) {
            $landmark->reviews_count = $landmark->reviews()->count();
            $landmark->rating = round($landmark->reviews()->avg('rating'), 2);
            $landmark->save();
        }

        // ─── 1 post per non-admin user ──────────────────────────
        foreach ($users as $user) {
            $landmark = $landmarks->random();

            Post::create([
                'user_id' => $user->id,
                'landmark_id' => $landmark->id,
                'category' => $landmark->category,
                'text' => $this->postTexts[array_rand($this->postTexts)],
                'likes_count' => rand(0, 50),
                'comments_count' => rand(0, 10),
            ]);
        }
    }
}
