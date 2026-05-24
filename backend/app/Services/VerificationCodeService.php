<?php

namespace App\Services;

use App\Models\User;
use App\Models\VerificationCode;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class VerificationCodeService
{
    public function generate(User $user, string $channel = 'email'): array
    {
        VerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('verified_at')
            ->delete();

        $plainCode = (string) random_int(100000, 999999);

        VerificationCode::create([
            'user_id' => $user->id,
            'channel' => $channel,
            'code' => Hash::make($plainCode),
            'expires_at' => Carbon::now()->addMinutes(10),
            'attempts' => 0,
            'max_attempts' => 5,
        ]);

        return [
            'plain_code' => $plainCode,
            'expires_in_minutes' => 10,
        ];
    }

    public function verify(User $user, string $plainCode): array
    {
        $record = VerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (!$record) {
            return [
                'ok' => false,
                'message' => 'Verification code not found.',
            ];
        }

        if (Carbon::now()->greaterThan($record->expires_at)) {
            return [
                'ok' => false,
                'message' => 'Verification code expired.',
            ];
        }

        if ($record->attempts >= $record->max_attempts) {
            return [
                'ok' => false,
                'message' => 'Maximum verification attempts reached.',
            ];
        }

        if (!Hash::check($plainCode, $record->code)) {
            $record->increment('attempts');

            return [
                'ok' => false,
                'message' => 'Invalid verification code.',
            ];
        }

        $record->update([
            'verified_at' => Carbon::now(),
        ]);

        $user->update([
            'is_active' => true,
            'email_verified_at' => Carbon::now(),
        ]);

        return [
            'ok' => true,
            'message' => 'Account verified successfully.',
        ];
    }
}

