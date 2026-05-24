<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OpenRouterService
{
    public function chat(array $messages): string
    {
        $apiKey = config('services.openrouter.api_key');
        $model = config('services.openrouter.model', 'openrouter/free');
        $baseUrl = rtrim((string) config('services.openrouter.base_url', 'https://openrouter.ai/api/v1'), '/');

        if (!$apiKey) {
            throw new \RuntimeException('OpenRouter API key is not configured.');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'HTTP-Referer'  => env('APP_URL'),
            'X-Title'       => env('APP_NAME'),
        ])->post($baseUrl . '/chat/completions', [
            'model'      => $model,
            'messages'   => $messages,
            'max_tokens' => 1000,
        ]);

        if ($response->failed()) {
            throw new \Exception('OpenRouter error: ' . $response->body());
        }

        return (string) data_get($response->json(), 'choices.0.message.content', '');
    }
}
