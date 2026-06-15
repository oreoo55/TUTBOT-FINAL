<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:190|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($validated['name']) . '&background=D4AF37&color=fff',
            'level' => 1,
            'xp' => 0,
            'next_level_xp' => 100,
        ]);

        $token = $user->createToken('tutbot')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $this->userResponse($user)], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('tutbot')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $this->userResponse($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userResponse($request->user()));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($validated['new_password'])]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|max:190|unique:users,email,' . $user->id,
            'bio' => 'sometimes|nullable|string|max:200',
            'location' => 'sometimes|nullable|string|max:120',
        ];

        if ($request->hasFile('avatar')) {
            $rules['avatar'] = 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120';
        } else {
            $rules['avatar'] = 'sometimes|string|max:500';
        }

        $validated = $request->validate($rules);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = Storage::url($path);
        }

        $user->update($validated);

        return response()->json($this->userResponse($user));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users',
        ]);

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $validated['email']],
            ['token' => Hash::make($otp), 'created_at' => now()]
        );

        $isDev = config('app.env') === 'local' || config('app.env') === 'development';
        $response = ['message' => 'If the email exists, an OTP has been sent.'];

        if ($isDev) {
            $response['otp'] = $otp;
        }

        return response()->json($response);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users',
        ]);

        $resetToken = bin2hex(random_bytes(32));

        DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->update(['token' => Hash::make($resetToken), 'created_at' => now()]);

        return response()->json([
            'message' => 'OTP verified.',
            'reset_token' => $resetToken,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users',
            'reset_token' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$record || !Hash::check($validated['reset_token'], $record->token)) {
            return response()->json(['message' => 'Invalid reset token.'], 400);
        }

        if (now()->diffInMinutes($record->created_at) > 10) {
            return response()->json(['message' => 'Reset token has expired.'], 400);
        }

        User::where('email', $validated['email'])->update([
            'password' => Hash::make($validated['password']),
        ]);

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json(['message' => 'Password has been reset successfully.']);
    }

    private function userResponse(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'level' => $user->level,
            'xp' => $user->xp,
            'next_level_xp' => $user->next_level_xp,
            'location' => $user->location,
            'bio' => $user->bio,
            'is_admin' => (bool) $user->is_admin,
            'badges' => $user->badges->map(fn($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'icon' => $b->icon,
                'description' => $b->description,
            ]),
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }
}
