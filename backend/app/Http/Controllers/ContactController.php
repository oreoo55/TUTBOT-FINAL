<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:190',
            'subject' => 'required|string|max:200',
            'message' => 'required|string|max:5000',
        ]);

        ContactMessage::create($validated);

        return response()->json(['message' => 'Message sent successfully.'], 201);
    }
}
