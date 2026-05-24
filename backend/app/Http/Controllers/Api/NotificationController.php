<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest('id')
            ->get();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, SystemNotification $notification): JsonResponse
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $notification->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Notification marquée comme lue.',
            'notification' => $notification,
        ]);
    }
}

