<?php

namespace App\Http\Controllers;

use App\Services\OpenRouterService;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function send(Request $request, OpenRouterService $openRouter)
    {
        $request->validate([
            'messages' => 'required|array',
            'messages.*.role' => 'required|string',
            'messages.*.content' => 'required|string',
        ]);

        try {
            $reply = $openRouter->chat($request->input('messages'));
            return response()->json(['reply' => $reply]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
