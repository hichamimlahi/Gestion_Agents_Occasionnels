<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PresidentStaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = User::query()
            ->with('role')
            ->whereHas('role', function ($query): void {
                $query->whereIn('slug', ['rh', 'naib_rh']);
            })
            ->latest('id')
            ->get();

        return response()->json([
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'cin' => ['required', 'string', 'max:20', 'unique:users,cin'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'in:male,female'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_slug' => ['required', 'in:rh,naib_rh'],
            'locale' => ['nullable', 'in:fr,ar'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $role = Role::query()->where('slug', $validated['role_slug'])->firstOrFail();
        $isActive = (bool) ($validated['is_active'] ?? true);

        $user = User::query()->create([
            'role_id' => $role->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'cin' => $validated['cin'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'locale' => $validated['locale'] ?? 'fr',
            'is_active' => $isActive,
            'email_verified_at' => $isActive ? now() : null,
        ]);

        return response()->json([
            'message' => 'Utilisateur RH créé avec succès.',
            'user' => $user->load('role'),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if (!$this->isManagedStaff($user)) {
            return response()->json([
                'message' => 'Utilisateur non autorisé dans cette gestion.',
            ], 422);
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'cin' => ['required', 'string', 'max:20', Rule::unique('users', 'cin')->ignore($user->id)],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'in:male,female'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role_slug' => ['required', 'in:rh,naib_rh'],
            'locale' => ['nullable', 'in:fr,ar'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $role = Role::query()->where('slug', $validated['role_slug'])->firstOrFail();
        $isActive = (bool) ($validated['is_active'] ?? $user->is_active);

        $updatePayload = [
            'role_id' => $role->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'cin' => $validated['cin'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'locale' => $validated['locale'] ?? $user->locale,
            'is_active' => $isActive,
            'email_verified_at' => $isActive
                ? ($user->email_verified_at ?? now())
                : null,
        ];

        if (!empty($validated['password'])) {
            $updatePayload['password'] = Hash::make($validated['password']);
        }

        $user->update($updatePayload);

        return response()->json([
            'message' => 'Utilisateur RH mis à jour avec succès.',
            'user' => $user->fresh()->load('role'),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        if (!$this->isManagedStaff($user)) {
            return response()->json([
                'message' => 'Utilisateur non autorisé dans cette gestion.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'Utilisateur RH supprimé avec succès.',
        ]);
    }

    public function photo(User $user): BinaryFileResponse|JsonResponse
    {
        if (!$this->isManagedStaff($user)) {
            return response()->json([
                'message' => 'Utilisateur non autorisÃ© dans cette gestion.',
            ], 422);
        }

        $path = $user->profile_photo_path;

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

    private function isManagedStaff(User $user): bool
    {
        return in_array(optional($user->role)->slug, ['rh', 'naib_rh'], true);
    }
}
