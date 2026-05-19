<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'user_id', 'landmark_id', 'booking_date', 'adults', 'children',
        'subtotal', 'service_fee', 'total', 'currency', 'payment_method',
        'payment_status', 'status', 'confirmation_code', 'qr_token',
        'payer_name', 'payer_email', 'payer_phone', 'cancelled_at', 'cancellation_requested_at', 'cancellation_reason', 'receipt_path',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date:Y-m-d',
            'cancelled_at' => 'datetime',
            'cancellation_requested_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function landmark(): BelongsTo
    {
        return $this->belongsTo(Landmark::class);
    }
}
