<?php

namespace App\Services;

use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function notify(
        User $user,
        string $title,
        string $body,
        string $type = 'system',
        array $data = [],
        bool $sendEmail = false
    ): SystemNotification {
        $notification = SystemNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        if ($sendEmail) {
            try {
                Mail::raw($body, static function ($message) use ($user, $title): void {
                    $message->to($user->email)->subject($title);
                });

                $notification->update([
                    'sent_email_at' => now(),
                ]);
            } catch (\Throwable $exception) {
                Log::warning('Email notification failed', [
                    'user_id' => $user->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return $notification;
    }
}

