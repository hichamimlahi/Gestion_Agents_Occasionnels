<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('candidate');

        return response()->json([
            'user' => $user,
            'candidate' => $user->candidate,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:30'],
            'locale' => ['nullable', 'in:fr,ar'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'education_level' => ['nullable', 'string', 'max:255'],
            'experience_notes' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'phone' => $validated['phone'],
            'locale' => $validated['locale'] ?? $user->locale,
        ]);

        $user->candidate()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'education_level' => $validated['education_level'] ?? null,
                'experience_notes' => $validated['experience_notes'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $user->fresh()->load('candidate'),
        ]);
    }
}

