<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$wikiTitles = require __DIR__ . '/wiki_titles.php';
$places = require __DIR__ . '/rawPlaces.php';

$categoryImages = [
    'museum' => ['https://images.unsplash.com/photo-1565060169187-5284a3eee9aa?auto=format&fit=crop&w=1000&q=80'],
    'historical_site' => ['https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1000&q=80'],
    'mosque' => ['https://images.unsplash.com/photo-1591030808126-3651dc9c39d8?auto=format&fit=crop&w=1000&q=80'],
    'church' => ['https://images.unsplash.com/photo-1548276145-69a9521f0499?auto=format&fit=crop&w=1000&q=80'],
    'park' => ['https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=1000&q=80'],
    'natural_landmark' => ['https://images.unsplash.com/photo-1573155993874-d5d48af862ba?auto=format&fit=crop&w=1000&q=80'],
    'beach' => ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'],
    'market' => ['https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1000&q=80'],
    'entertainment' => ['https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80'],
    'tourist_attraction' => ['https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1000&q=80'],
    'cultural_landmark' => ['https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1000&q=80'],
];

$specificIds = [1,2,3,4,5,7,9,10,17,21,44,45,46,47,48,50,51,59,64,67,68,69,73,74,76,82,90,93,104,105,107,110,111,113,114];
$updated = 0;
$fromWiki = 0;
$fallback = 0;
$errors = [];

foreach ($places as $p) {
    $id = (int) $p['Place_ID'];
    $rawCat = strtolower($p['Category']);

    // Skip landmarks that already have specific images
    if (in_array($id, $specificIds)) continue;

    $image = null;
    $title = $wikiTitles[$id] ?? null;

    if ($title) {
        // Try to get image from Wikipedia
        $url = "https://en.wikipedia.org/w/api.php?action=query&titles={$title}&prop=pageimages&format=json&pithumbsize=1000";
        $ctx = stream_context_create(['http' => ['timeout' => 5, 'user_agent' => 'TUTBOT/1.0']]);
        $wikiResult = @file_get_contents($url, false, $ctx);

        if ($wikiResult) {
            $data = json_decode($wikiResult, true);
            foreach ($data['query']['pages'] ?? [] as $page) {
                if (isset($page['thumbnail']['source'])) {
                    $image = $page['thumbnail']['source'];
                    $fromWiki++;
                    break;
                }
            }
        }

        if (!$image) {
            // Try searching Wikipedia
            $searchTerm = str_replace('%27', "'", str_replace('_', ' ', $title));
            $searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" . urlencode($searchTerm) . "&format=json&srlimit=1";
            $searchResult = @file_get_contents($searchUrl, false, $ctx);
            if ($searchResult) {
                $searchData = json_decode($searchResult, true);
                if (!empty($searchData['query']['search'][0]['title'])) {
                    $foundTitle = str_replace(' ', '_', $searchData['query']['search'][0]['title']);
                    $imgUrl = "https://en.wikipedia.org/w/api.php?action=query&titles={$foundTitle}&prop=pageimages&format=json&pithumbsize=1000";
                    $imgResult = @file_get_contents($imgUrl, false, $ctx);
                    if ($imgResult) {
                        $imgData = json_decode($imgResult, true);
                        foreach ($imgData['query']['pages'] ?? [] as $page) {
                            if (isset($page['thumbnail']['source'])) {
                                $image = $page['thumbnail']['source'];
                                $fromWiki++;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // Fallback to category image
    if (!$image) {
        $pool = $categoryImages[$rawCat] ?? $categoryImages['tourist_attraction'];
        $image = $pool[0];
        $fallback++;
    }

    App\Models\Landmark::where('id', $id)->update(['image' => $image]);
    $updated++;
    echo "ID {$id}: {$p['Place_Name']} -> " . substr($image, 0, 60) . "..." . PHP_EOL;
}

echo PHP_EOL . "--- Summary ---" . PHP_EOL;
echo "Updated: {$updated}" . PHP_EOL;
echo "From Wikipedia: {$fromWiki}" . PHP_EOL;
echo "Category fallback: {$fallback}" . PHP_EOL;
