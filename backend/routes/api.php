<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\LandmarkController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostLikeController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

// ─── Auth ───────────────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/me', [AuthController::class, 'update']);
    Route::post('/me/password', [AuthController::class, 'changePassword']);

    // ─── Favorites ───────────────────────────────────────────────────
    Route::get('/me/favorites', [FavoriteController::class, 'index']);
    Route::post('/me/favorites', [FavoriteController::class, 'store']);
    Route::delete('/me/favorites/{landmark_id}', [FavoriteController::class, 'destroy']);

    // ─── Wishlist ────────────────────────────────────────────────────
    Route::get('/me/wishlist', [WishlistController::class, 'index']);
    Route::post('/me/wishlist', [WishlistController::class, 'store']);
    Route::delete('/me/wishlist/{landmark_id}', [WishlistController::class, 'destroy']);

    // ─── Bookings ────────────────────────────────────────────────────
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/me/bookings', [BookingController::class, 'myBookings']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings/{id}/request-cancellation', [BookingController::class, 'requestCancellation']);

    // ─── Community (writes) ──────────────────────────────────────────
    Route::post('/community/posts', [PostController::class, 'store']);
    Route::put('/community/posts/{id}', [PostController::class, 'update']);
    Route::delete('/community/posts/{id}', [PostController::class, 'destroy']);
    Route::post('/community/posts/{id}/like', [PostLikeController::class, 'toggle']);
    Route::post('/community/posts/{id}/comments', [CommentController::class, 'store']);
    Route::put('/community/posts/{id}/comments/{commentId}', [CommentController::class, 'update']);
    Route::delete('/community/posts/{id}/comments/{commentId}', [CommentController::class, 'destroy']);

    // ─── Reviews (writes) ────────────────────────────────────────────
    Route::post('/landmarks/{id}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // ─── Notifications ────────────────────────────────────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
});

// ─── Admin ────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);

    // Landmark CRUD
    Route::post('/landmarks', [AdminController::class, 'storeLandmark']);
    Route::put('/landmarks/{id}', [AdminController::class, 'updateLandmark']);
    Route::delete('/landmarks/{id}', [AdminController::class, 'destroyLandmark']);

    // Content moderation
    Route::get('/reviews', [AdminController::class, 'listReviews']);
    Route::delete('/reviews/{id}', [AdminController::class, 'destroyReview']);
    Route::get('/posts', [AdminController::class, 'listPosts']);
    Route::delete('/posts/{id}', [AdminController::class, 'destroyPost']);
    Route::get('/comments', [AdminController::class, 'listComments']);
    Route::delete('/comments/{id}', [AdminController::class, 'destroyComment']);

    // Bookings list (paginated, filterable)
    Route::get('/bookings', [AdminController::class, 'listBookings']);

    // Booking export
    Route::get('/bookings/export', [AdminController::class, 'exportBookings']);

    // Cancellation management
    Route::get('/cancellation-requests', [BookingController::class, 'listCancellationRequests']);
    Route::post('/bookings/{id}/approve-cancellation', [BookingController::class, 'approveCancellation']);
    Route::post('/bookings/{id}/reject-cancellation', [BookingController::class, 'rejectCancellation']);

    // QR verification
    Route::post('/bookings/verify-qr', [AdminController::class, 'verifyQr']);

    // Payment approvals
    Route::get('/payments', [AdminController::class, 'listPayments']);
    Route::post('/payments/{id}/approve', [AdminController::class, 'approvePayment']);
    Route::post('/payments/{id}/reject', [AdminController::class, 'rejectPayment']);

    // Direct admin cancel
    Route::post('/bookings/{id}/cancel', [AdminController::class, 'cancelBooking']);

    // Admin delete booking (cancelled only)
    Route::delete('/bookings/{id}', [AdminController::class, 'destroyBooking']);

    // Admin edit booking
    Route::put('/bookings/{id}', [AdminController::class, 'updateBooking']);

    // Admin user list + notifications
    Route::get('/users', [AdminController::class, 'listUsers']);
    Route::get('/users/detailed', [AdminController::class, 'listUsersDetailed']);
    Route::post('/users/notify', [AdminController::class, 'sendNotification']);
});

// ─── Public Landmarks / Badges ─────────────────────────────────────
Route::get('/landmarks', [LandmarkController::class, 'index']);
Route::get('/landmarks/{id}', [LandmarkController::class, 'show']);
Route::get('/landmarks/{id}/reviews', [ReviewController::class, 'index']);
Route::get('/reviews/random', [ReviewController::class, 'random']);
Route::get('/badges', function () {
    return response()->json(['data' => \App\Models\Badge::all()]);
});

// ─── Public Community ───────────────────────────────────────────────
Route::get('/community/posts', [PostController::class, 'index']);
Route::get('/community/posts/{id}/comments', [CommentController::class, 'index']);
Route::get('/community/leaderboard', [LeaderboardController::class, 'index']);

// ─── Public User Profiles ───────────────────────────────────────────
Route::get('/users/{id}', [UserController::class, 'show']);
Route::get('/users/{id}/posts', [UserController::class, 'posts']);
Route::get('/users/{id}/reviews', [UserController::class, 'reviews']);

// ─── AI (public with optional auth) ─────────────────────────────────
Route::post('/ai/chat', [AiController::class, 'chat']);
Route::post('/ai/recommendations', [AiController::class, 'recommendations']);

// Optional: OpenRouter direct chat endpoint (simple passthrough)
use App\Http\Controllers\ChatController;
Route::post('/chat', [ChatController::class, 'send']);
