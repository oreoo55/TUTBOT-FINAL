<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Console\Command;

class TripReminder extends Command
{
    protected $signature = 'trip:remind';
    protected $description = 'Send notifications for trips starting tomorrow';

    public function handle(): int
    {
        $tomorrow = now()->addDay()->toDateString();

        $bookings = Booking::with('landmark')
            ->whereDate('booking_date', $tomorrow)
            ->where('status', 'confirmed')
            ->get();

        $count = 0;
        foreach ($bookings as $booking) {
            $existing = Notification::where('user_id', $booking->user_id)
                ->where('type', 'trip_reminder')
                ->whereDate('created_at', today())
                ->where('data->booking_id', (string) $booking->id)
                ->exists();

            if (!$existing) {
                Notification::create([
                    'user_id' => $booking->user_id,
                    'type' => 'trip_reminder',
                    'data' => [
                        'booking_id' => (string) $booking->id,
                        'landmark_name' => $booking->landmark?->name ?? 'Unknown',
                        'booking_date' => $tomorrow,
                        'message' => 'Your trip to ' . ($booking->landmark?->name ?? 'Unknown') . ' is tomorrow!',
                    ],
                ]);
                $count++;
            }
        }

        $this->info("Sent {$count} trip reminders for tomorrow ({$tomorrow}).");

        return self::SUCCESS;
    }
}
