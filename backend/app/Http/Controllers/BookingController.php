<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Landmark;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $rules = [
            'landmark_id' => 'required|exists:landmarks,id',
            'booking_date' => 'required|date|after_or_equal:today',
            'adults' => 'required|integer|min:1|max:50',
            'children' => 'required|integer|min:0|max:50',
            'payment_method' => 'required|in:card,vodafone,instapay,cash',
            'payer_details.name' => 'required|string|max:120',
            'payer_details.email' => 'required|email|max:190',
            'payer_details.phone' => 'nullable|string|max:40',
        ];

        $rules['receipt_base64'] = 'nullable|string';
        $rules['receipt_extension'] = 'nullable|string|in:png,jpg,jpeg,webp';

        $validated = $request->validate($rules);

        $landmark = Landmark::findOrFail((int) $validated['landmark_id']);
        $price = $landmark->price;

        $adults = $validated['adults'];
        $children = $validated['children'];
        $subtotal = $adults * $price + $children * $price * 0.5;
        $serviceFee = $price === 0 ? 0 : 50;
        $total = $price === 0 ? 0 : (int) $subtotal + $serviceFee;

        do {
            $confirmationCode = strtoupper(Str::random(6));
        } while (Booking::where('confirmation_code', $confirmationCode)->exists());

        $qrToken = bin2hex(random_bytes(32));

        // Determine payment status: vodafone/instapay require admin approval
        $paymentMethod = $validated['payment_method'];
        $paymentStatus = ($paymentMethod === 'cash' || $paymentMethod === 'vodafone' || $paymentMethod === 'instapay') ? 'pending' : 'paid';

        // Store receipt file if uploaded as base64
        $receiptPath = null;
        if (!empty($validated['receipt_base64'])) {
            $ext = $validated['receipt_extension'] ?? 'png';
            $data = base64_decode($validated['receipt_base64']);
            $filename = 'receipts/' . uniqid() . '.' . $ext;
            Storage::disk('public')->put($filename, $data);
            $receiptPath = $filename;
        }

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'landmark_id' => $landmark->id,
            'booking_date' => $validated['booking_date'],
            'adults' => $adults,
            'children' => $children,
            'subtotal' => (int) $subtotal,
            'service_fee' => $serviceFee,
            'total' => $total,
            'currency' => 'EGP',
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'receipt_path' => $receiptPath,
            'status' => 'confirmed',
            'confirmation_code' => $confirmationCode,
            'qr_token' => $qrToken,
            'payer_name' => $validated['payer_details']['name'],
            'payer_email' => $validated['payer_details']['email'],
            'payer_phone' => $validated['payer_details']['phone'] ?? null,
        ]);

        $booking->load('landmark');

        $request->user()->addXp(50);
        $newBadges = $request->user()->checkBadges();

        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'booking_confirmed',
            'data' => [
                'booking_id' => (string) $booking->id,
                'landmark_name' => $booking->landmark?->name ?? 'Unknown',
                'booking_date' => $booking->booking_date->format('Y-m-d'),
            ],
        ]);

        return response()->json($this->bookingResponse($booking), 201);
    }

    public function myBookings(Request $request): JsonResponse
    {
        $query = $request->user()->bookings()->with('landmark');

        $status = $request->query('status', 'all');
        if ($status === 'current') {
            $query->where('booking_date', '>=', now()->toDateString())
                  ->where('status', '!=', 'cancelled')
                  ->whereNull('cancellation_requested_at');
        } elseif ($status === 'previous') {
            $query->where(function ($q) {
                $q->where('booking_date', '<', now()->toDateString())
                  ->orWhere('status', 'cancelled')
                  ->orWhereNotNull('cancellation_requested_at');
            });
        }

        $bookings = $query->orderByDesc('booking_date')->paginate(20);

        $bookings->getCollection()->transform(fn($b) => $this->bookingResponse($b));

        return response()->json($bookings);
    }

    public function show(string $id): JsonResponse
    {
        $booking = Booking::with('landmark')->findOrFail((int) $id);

        return response()->json($this->bookingResponse($booking));
    }

    public function requestCancellation(string $id): JsonResponse
    {
        $booking = Booking::findOrFail((int) $id);

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking already cancelled.'], 400);
        }

        if ($booking->cancellation_requested_at) {
            return response()->json(['message' => 'Cancellation already requested.'], 400);
        }

        $booking->update([
            'cancellation_requested_at' => now(),
        ]);

        return response()->json([
            'id' => (string) $booking->id,
            'status' => 'cancellation_requested',
        ]);
    }

    public function approveCancellation(Request $request, string $id): JsonResponse
    {
        abort_unless($request->user()?->is_admin, 403, 'Admin access required');
        $booking = Booking::findOrFail((int) $id);

        if (!$booking->cancellation_requested_at) {
            return response()->json(['message' => 'No cancellation request for this booking.'], 400);
        }

        $now = now();
        $bookingDate = \Carbon\Carbon::parse($booking->booking_date);
        $refundEligible = $now->diffInHours($bookingDate, false) > 24;

        $booking->update([
            'status' => 'cancelled',
            'payment_status' => $refundEligible ? 'refunded' : 'pending',
            'cancelled_at' => $now,
            'cancellation_requested_at' => null,
        ]);

        $landmarkName = $booking->landmark?->name ?? 'Booking';
        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'cancellation_approved',
            'data' => [
                'booking_id' => (string) $booking->id,
                'landmark_name' => $landmarkName,
                'booking_date' => $booking->booking_date->format('Y-m-d'),
                'refund_amount' => $refundEligible ? $booking->total : 0,
            ],
        ]);

        return response()->json([
            'id' => (string) $booking->id,
            'status' => 'cancelled',
            'refund' => $refundEligible ? [
                'amount' => $booking->total,
                'eta_days' => 5,
            ] : null,
        ]);
    }

    public function rejectCancellation(Request $request, string $id): JsonResponse
    {
        abort_unless($request->user()?->is_admin, 403, 'Admin access required');
        $booking = Booking::findOrFail((int) $id);

        if (!$booking->cancellation_requested_at) {
            return response()->json(['message' => 'No cancellation request for this booking.'], 400);
        }

        $booking->update(['cancellation_requested_at' => null]);

        $landmarkName = $booking->landmark?->name ?? 'Booking';
        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'cancellation_rejected',
            'data' => [
                'booking_id' => (string) $booking->id,
                'landmark_name' => $landmarkName,
                'booking_date' => $booking->booking_date->format('Y-m-d'),
            ],
        ]);

        return response()->json([
            'id' => (string) $booking->id,
            'status' => 'confirmed',
        ]);
    }

    public function listCancellationRequests(Request $request): JsonResponse
    {
        abort_unless($request->user()?->is_admin, 403, 'Admin access required');
        $bookings = Booking::with('user', 'landmark')
            ->whereNotNull('cancellation_requested_at')
            ->latest('cancellation_requested_at')
            ->get()
            ->map(fn($b) => [
                'id' => (string) $b->id,
                'confirmation_code' => $b->confirmation_code,
                'user' => ['id' => $b->user?->id, 'name' => $b->user?->name ?? 'N/A'],
                'landmark' => $b->landmark?->name ?? 'N/A',
                'booking_date' => $b->booking_date->format('Y-m-d'),
                'total' => $b->total,
                'currency' => $b->currency,
                'requested_at' => $b->cancellation_requested_at->toIso8601String(),
            ]);

        return response()->json($bookings);
    }

    private function bookingResponse(Booking $b): array
    {
        return [
            'id' => (string) $b->id,
            'confirmation_code' => $b->confirmation_code,
            'status' => $b->status,
            'landmark' => LandmarkController::landmarkResponse($b->landmark),
            'booking_date' => $b->booking_date->format('Y-m-d'),
            'adults' => $b->adults,
            'children' => $b->children,
            'subtotal' => $b->subtotal,
            'service_fee' => $b->service_fee,
            'total' => $b->total,
            'currency' => $b->currency,
            'payment_method' => $b->payment_method,
            'payment_status' => $b->payment_status,
            'receipt_url' => $b->receipt_path ? Storage::url($b->receipt_path) : null,
            'qr_token' => $b->qr_token,
            'payer_name' => $b->payer_name,
            'payer_email' => $b->payer_email,
            'payer_phone' => $b->payer_phone,
            'cancellation_requested_at' => $b->cancellation_requested_at?->toIso8601String(),
            'cancelled_at' => $b->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $b->cancellation_reason,
            'created_at' => $b->created_at?->toIso8601String(),
        ];
    }
}
