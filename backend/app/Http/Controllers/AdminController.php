<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Comment;
use App\Models\Landmark;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->is_admin, 403, 'Admin access required');
    }

    // ─── Dashboard Stats ─────────────────────────────────────────────

    public function stats(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'users' => User::count(),
            'landmarks' => Landmark::count(),
            'bookings' => Booking::count(),
            'reviews' => Review::count(),
            'posts' => Post::count(),
            'comments' => Comment::count(),
            'recent_bookings' => Booking::with('user', 'landmark')
                ->latest()->take(10)->get()->map(fn($b) => [
                    'id' => $b->id,
                    'user' => $b->user?->name ?? 'N/A',
                    'landmark' => $b->landmark?->name ?? 'N/A',
                    'total' => $b->total,
                    'currency' => $b->currency,
                    'status' => $b->status,
                    'created_at' => $b->created_at?->toIso8601String(),
                ]),
        ]);
    }

    // ─── Landmark CRUD ───────────────────────────────────────────────

    private function resolveImage(Request $request, ?Landmark $landmark = null): ?string
    {
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('landmarks', 'public');
            return Storage::url($path);
        }

        if ($request->filled('image')) {
            return $request->input('image');
        }

        return $landmark?->image;
    }

    public function storeLandmark(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $rules = [
            'name' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'area' => 'nullable|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'price' => 'nullable|integer|min:0',
            'opening_hours' => 'nullable|string|max:50',
            'closing_hours' => 'nullable|string|max:50',
        ];

        if ($request->hasFile('image')) {
            $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120';
        } else {
            $rules['image'] = 'nullable|string|max:500';
        }

        $validated = $request->validate($rules);
        $validated['image'] = $this->resolveImage($request);

        $landmark = Landmark::create($validated);

        return response()->json($landmark, 201);
    }

    public function updateLandmark(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $landmark = Landmark::findOrFail((int) $id);

        $rules = [
            'name' => 'sometimes|string|max:255',
            'region' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'area' => 'nullable|string|max:255',
            'category' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'price' => 'nullable|integer|min:0',
            'opening_hours' => 'nullable|string|max:50',
            'closing_hours' => 'nullable|string|max:50',
        ];

        if ($request->hasFile('image')) {
            $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120';
        } else {
            $rules['image'] = 'nullable|string|max:500';
        }

        $validated = $request->validate($rules);
        $validated['image'] = $this->resolveImage($request, $landmark);

        $landmark->update($validated);

        return response()->json($landmark);
    }

    public function destroyLandmark(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $landmark = Landmark::findOrFail((int) $id);
        $landmark->delete();

        return response()->json(null, 204);
    }

    // ─── Content Moderation ──────────────────────────────────────────

    public function destroyReview(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $review = Review::findOrFail((int) $id);
        $landmark = $review->landmark;
        $review->delete();

        if ($landmark) {
            $landmark->reviews_count = $landmark->reviews()->count();
            $landmark->rating = round($landmark->reviews()->avg('rating'), 2);
            $landmark->save();
        }

        return response()->json(null, 204);
    }

    public function destroyPost(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $post = Post::findOrFail((int) $id);
        $post->delete();

        return response()->json(null, 204);
    }

    public function destroyComment(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $comment = Comment::findOrFail((int) $id);
        $comment->delete();

        return response()->json(null, 204);
    }

    // ─── List content for moderation ─────────────────────────────────

    public function listReviews(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = Review::with('user', 'landmark');

        if ($request->filled('landmark')) {
            $query->whereHas('landmark', fn($q) => $q->where('name', 'like', '%'.$request->landmark.'%'));
        }
        if ($request->filled('city')) {
            $query->whereHas('landmark', fn($q) => $q->where('city', 'like', '%'.$request->city.'%'));
        }
        if ($request->filled('username')) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', '%'.$request->username.'%'));
        }
        if ($request->filled('email')) {
            $query->whereHas('user', fn($q) => $q->where('email', 'like', '%'.$request->email.'%'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $reviews = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json($reviews);
    }

    public function listPosts(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = Post::with('user', 'landmark');

        if ($request->filled('landmark')) {
            $query->whereHas('landmark', fn($q) => $q->where('name', 'like', '%'.$request->landmark.'%'));
        }
        if ($request->filled('city')) {
            $query->whereHas('landmark', fn($q) => $q->where('city', 'like', '%'.$request->city.'%'));
        }
        if ($request->filled('username')) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', '%'.$request->username.'%'));
        }
        if ($request->filled('email')) {
            $query->whereHas('user', fn($q) => $q->where('email', 'like', '%'.$request->email.'%'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $posts = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json($posts);
    }

    public function listComments(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = Comment::with('user', 'post.landmark');

        if ($request->filled('landmark')) {
            $query->whereHas('post.landmark', fn($q) => $q->where('name', 'like', '%'.$request->landmark.'%'));
        }
        if ($request->filled('city')) {
            $query->whereHas('post.landmark', fn($q) => $q->where('city', 'like', '%'.$request->city.'%'));
        }
        if ($request->filled('username')) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', '%'.$request->username.'%'));
        }
        if ($request->filled('email')) {
            $query->whereHas('user', fn($q) => $q->where('email', 'like', '%'.$request->email.'%'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $comments = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json($comments);
    }

    // ─── Bookings list (paginated, filterable) ────────────────────────

    public function listBookings(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = Booking::with('user', 'landmark');

        if ($request->filled('landmark')) {
            $query->whereHas('landmark', fn($q) => $q->where('name', 'like', '%'.$request->landmark.'%'));
        }
        if ($request->filled('city')) {
            $query->whereHas('landmark', fn($q) => $q->where('city', 'like', '%'.$request->city.'%'));
        }
        if ($request->filled('username')) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', '%'.$request->username.'%'));
        }
        if ($request->filled('phone')) {
            $query->where('payer_phone', 'like', '%'.$request->phone.'%');
        }
        if ($request->filled('email')) {
            $query->where(function ($q) use ($request) {
                $q->where('payer_email', 'like', '%'.$request->email.'%')
                  ->orWhereHas('user', fn($uq) => $uq->where('email', 'like', '%'.$request->email.'%'));
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('booking_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('booking_date', '<=', $request->date_to);
        }

        $bookings = $query->latest()->paginate($request->integer('per_page', 10));

        return response()->json($bookings);
    }

    // ─── Booking Export (CSV) ─────────────────────────────────────────

    public function exportBookings(Request $request)
    {
        $this->ensureAdmin($request);

        $query = Booking::with('user', 'landmark');

        if ($request->filled('landmark')) {
            $query->whereHas('landmark', fn($q) => $q->where('name', 'like', '%'.$request->landmark.'%'));
        }
        if ($request->filled('city')) {
            $query->whereHas('landmark', fn($q) => $q->where('city', 'like', '%'.$request->city.'%'));
        }
        if ($request->filled('username')) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', '%'.$request->username.'%'));
        }
        if ($request->filled('phone')) {
            $query->where('payer_phone', 'like', '%'.$request->phone.'%');
        }
        if ($request->filled('email')) {
            $query->where(function ($q) use ($request) {
                $q->where('payer_email', 'like', '%'.$request->email.'%')
                  ->orWhereHas('user', fn($uq) => $uq->where('email', 'like', '%'.$request->email.'%'));
            });
        }
        if ($request->filled('date_from') || $request->filled('start_date')) {
            $query->whereDate('booking_date', '>=', $request->filled('date_from') ? $request->date_from : $request->start_date);
        }
        if ($request->filled('date_to') || $request->filled('end_date')) {
            $query->whereDate('booking_date', '<=', $request->filled('date_to') ? $request->date_to : $request->end_date);
        }

        $bookings = $query->orderBy('booking_date', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="bookings_export_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($bookings) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, [
                'ID', 'Confirmation Code', 'Status', 'Payment Status', 'Payment Method',
                'User Name', 'User Email', 'User Phone',
                'Landmark', 'Booking Date',
                'Adults', 'Children',
                'Subtotal', 'Service Fee', 'Total', 'Currency',
                'Payer Name', 'Payer Email',
                'Created At', 'Cancelled At',
            ]);

            foreach ($bookings as $b) {
                fputcsv($handle, [
                    $b->id,
                    $b->confirmation_code,
                    $b->status,
                    $b->payment_status,
                    $b->payment_method,
                    $b->user?->name ?? 'N/A',
                    $b->user?->email ?? 'N/A',
                    $b->payer_phone ?? 'N/A',
                    $b->landmark?->name ?? 'N/A',
                    $b->booking_date,
                    $b->adults,
                    $b->children,
                    $b->subtotal,
                    $b->service_fee,
                    $b->total,
                    $b->currency,
                    $b->payer_name,
                    $b->payer_email,
                    $b->created_at?->toIso8601String(),
                    $b->cancelled_at?->toIso8601String() ?? '',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    // ─── Direct Cancel Booking ─────────────────────────────────────────

    public function cancelBooking(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $booking = Booking::findOrFail((int) $id);

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking already cancelled.'], 400);
        }

        $booking->update([
            'status' => 'cancelled',
            'payment_status' => 'pending',
            'cancelled_at' => now(),
            'cancellation_requested_at' => null,
            'cancellation_reason' => $validated['reason'] ?? null,
        ]);

        $landmarkName = $booking->landmark?->name ?? 'Booking';
        $notifData = [
            'booking_id' => (string) $booking->id,
            'landmark_name' => $landmarkName,
            'booking_date' => $booking->booking_date->format('Y-m-d'),
            'admin_name' => 'TUTBOT Support',
        ];

        if (!empty($validated['reason'])) {
            $notifData['reason'] = $validated['reason'];
        }

        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'booking_cancelled',
            'data' => $notifData,
        ]);

        return response()->json(['success' => true, 'id' => (string) $booking->id, 'status' => 'cancelled']);
    }

    // ─── Verify QR ─────────────────────────────────────────────────────

    public function verifyQr(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'qr_token' => 'required|string|size:64',
        ]);

        $booking = Booking::with('user', 'landmark')->where('qr_token', $validated['qr_token'])->first();

        if (!$booking) {
            return response()->json(['valid' => false, 'error' => 'Invalid QR code — no booking found.'], 404);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['valid' => false, 'error' => 'This booking has been cancelled.'], 400);
        }

        if ($booking->payment_method === 'cash' && $booking->payment_status !== 'paid') {
            return response()->json(['valid' => false, 'error' => 'Payment pending (cash). Please confirm payment before entry.'], 400);
        }

        if ($booking->booking_date->format('Y-m-d') !== now()->toDateString()) {
            return response()->json(['valid' => false, 'error' => 'Booking is not for today. This ticket is valid for ' . $booking->booking_date->format('Y-m-d') . '.'], 400);
        }

        $lm = $booking->landmark;
        return response()->json([
            'valid' => true,
            'booking' => [
                'id' => (string) $booking->id,
                'confirmation_code' => $booking->confirmation_code,
                'status' => $booking->status,
                'landmark_id' => $lm?->id,
                'landmark' => $lm?->name,
                'landmark_image' => $lm?->image,
                'landmark_region' => $lm?->region,
                'booking_date' => $booking->booking_date->format('Y-m-d'),
                'adults' => $booking->adults,
                'children' => $booking->children,
                'subtotal' => $booking->subtotal,
                'service_fee' => $booking->service_fee,
                'total' => $booking->total,
                'currency' => $booking->currency,
                'payment_method' => $booking->payment_method,
                'payment_status' => $booking->payment_status,
                'payer_name' => $booking->payer_name,
                'payer_email' => $booking->payer_email,
                'payer_phone' => $booking->payer_phone,
                'user_id' => $booking->user?->id,
                'user' => $booking->user?->name,
                'created_at' => $booking->created_at?->toIso8601String(),
            ],
        ]);
    }

    // ─── Delete Booking ─────────────────────────────────────────────────

    public function destroyBooking(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $booking = Booking::findOrFail((int) $id);
        $booking->delete();
        return response()->json(null, 204);
    }

    // ─── Update Booking ─────────────────────────────────────────────────

    public function updateBooking(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $booking = Booking::findOrFail((int) $id);

        $validated = $request->validate([
            'booking_date' => 'sometimes|date|after_or_equal:today',
            'adults' => 'sometimes|integer|min:1|max:50',
            'children' => 'sometimes|integer|min:0|max:50',
            'payment_method' => 'sometimes|in:card,vodafone,instapay,cash',
            'payment_status' => 'sometimes|in:pending,paid,failed,refunded',
            'status' => 'sometimes|in:confirmed,cancelled,completed,no_show',
            'payer_name' => 'sometimes|string|max:120',
            'payer_email' => 'sometimes|email|max:190',
            'payer_phone' => 'nullable|string|max:40',
        ]);

        if (isset($validated['adults']) || isset($validated['children'])) {
            $landmark = $booking->landmark;
            $price = $landmark?->price ?? 0;
            $adults = $validated['adults'] ?? $booking->adults;
            $children = $validated['children'] ?? $booking->children;
            $subtotal = $adults * $price + $children * $price * 0.5;
            $validated['subtotal'] = (int) $subtotal;
            $validated['total'] = $price === 0 ? 0 : (int) $subtotal + ($price === 0 ? 0 : 50);
        }

        $wasRefunded = $booking->payment_status === 'refunded';
        $booking->update($validated);
        $booking->load('landmark');

        if (isset($validated['payment_status']) && $validated['payment_status'] === 'refunded' && !$wasRefunded) {
            $landmarkName = $booking->landmark?->name ?? 'Booking';
            Notification::create([
                'user_id' => $booking->user_id,
                'type' => 'payment_refunded',
                'data' => [
                    'booking_id' => (string) $booking->id,
                    'landmark_name' => $landmarkName,
                    'amount' => $booking->total,
                    'currency' => $booking->currency,
                ],
            ]);
        }

        return response()->json($booking);
    }

    // ─── List Users ────────────────────────────────────────────────────

    public function listUsers(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $search = $request->query('search');
        $query = User::select('id', 'name', 'email');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('name')->limit(100)->get());
    }

    // ─── Send Notification ────────────────────────────────────────────

    public function sendNotification(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'message' => 'required|string|max:1000',
            'type' => 'nullable|string|max:50',
        ]);

        $user = User::where('email', $validated['email'])->firstOrFail();

        Notification::create([
            'user_id' => $user->id,
            'type' => $validated['type'] ?? 'admin_message',
            'data' => [
                'message' => $validated['message'],
                'admin_name' => 'TUTBOT Support',
            ],
        ]);

        return response()->json(['success' => true]);
    }
}
