<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'candidate']);

        return response()->json([
            'user' => $user,
            'candidate' => $user->candidate,
            'has_profile_photo' => !empty($user->profile_photo_path),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'address' => ['nullable', 'string', 'max:255'],
            'locale' => ['nullable', 'in:fr,ar'],
            'current_password' => ['nullable', 'string', 'required_with:new_password'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'remove_profile_photo' => ['nullable', 'boolean'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if (!empty($validated['new_password']) && !Hash::check($validated['current_password'] ?? '', $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $updatePayload = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'address' => $validated['address'] ?? null,
        ];

        if (!empty($validated['locale'])) {
            $updatePayload['locale'] = $validated['locale'];
        }

        if (!empty($validated['new_password'])) {
            $updatePayload['password'] = Hash::make($validated['new_password']);
        }

        $shouldRemoveProfilePhoto = (bool) ($validated['remove_profile_photo'] ?? false);
        if ($shouldRemoveProfilePhoto && !empty($user->profile_photo_path)) {
            if (Storage::disk('local')->exists($user->profile_photo_path)) {
                Storage::disk('local')->delete($user->profile_photo_path);
            }
            $updatePayload['profile_photo_path'] = null;
        }

        if ($request->hasFile('profile_photo')) {
            if (!empty($user->profile_photo_path) && Storage::disk('local')->exists($user->profile_photo_path)) {
                Storage::disk('local')->delete($user->profile_photo_path);
            }

            $updatePayload['profile_photo_path'] = $request->file('profile_photo')->store('profile-photos');
        }

        $user->update($updatePayload);

        if (optional($user->role)->slug === 'occasionnel') {
            $user->candidate()->updateOrCreate(
                ['user_id' => $user->id],
                ['address' => $validated['address'] ?? null]
            );
        }

        $freshUser = $user->fresh()->load(['role', 'candidate']);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $freshUser,
            'has_profile_photo' => !empty($freshUser->profile_photo_path),
        ]);
    }

    public function photo(Request $request): BinaryFileResponse|JsonResponse
    {
        $path = $request->user()->profile_photo_path;

        if (empty($path) || !Storage::disk('local')->exists($path)) {
            return response()->json([
                'message' => 'Profile photo not found.',
            ], 404);
        }

        return response()->file(Storage::disk('local')->path($path), [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
