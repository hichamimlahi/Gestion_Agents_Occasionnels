<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\VerificationCodeService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private VerificationCodeService $verificationCodeService,
        private NotificationService $notificationService
    ) {
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'cin' => ['required', 'string', 'max:20', 'unique:users,cin'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'in:male,female'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'locale' => ['nullable', 'in:fr,ar'],
        ]);

        $age = Carbon::parse($validated['birth_date'])->age;
        if ($age <= 18 || $age >= 60) {
            return response()->json([
                'message' => "L'age doit etre strictement superieur a 18 ans et strictement inferieur a 60 ans.",
            ], 422);
        }

        $occasionnelRole = Role::query()->firstOrCreate(
            ['slug' => 'occasionnel'],
            [
                'name' => 'Occasionnel',
                'description' => 'Temporary worker candidate',
            ]
        );

        $user = User::create([
            'role_id' => $occasionnelRole->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'cin' => $validated['cin'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'locale' => $validated['locale'] ?? 'fr',
            'is_active' => false,
        ]);

        Candidate::create([
            'user_id' => $user->id,
        ]);

        $verificationPayload = $this->verificationCodeService->generate($user, 'email');

        $this->notificationService->notify(
            $user,
            'Code de verification',
            "Votre code de verification est: {$verificationPayload['plain_code']}",
            'auth',
            ['channel' => 'email'],
            true
        );

        return response()->json([
            'message' => 'Compte cree. Verifiez votre email avec le code envoye.',
            'user' => $user->load('role'),
            'verification' => [
                'channel' => 'email',
                'expires_in_minutes' => $verificationPayload['expires_in_minutes'],
                'code_preview' => $verificationPayload['plain_code'],
            ],
        ], 201);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'min:6', 'max:10'],
        ]);

        $user = User::query()->where('email', $validated['email'])->firstOrFail();
        $result = $this->verificationCodeService->verify($user, $validated['code']);

        if (!$result['ok']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function resendCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $validated['email'])->firstOrFail();
        $verificationPayload = $this->verificationCodeService->generate($user, 'email');

        $this->notificationService->notify(
            $user,
            'Nouveau code de verification',
            "Votre nouveau code est: {$verificationPayload['plain_code']}",
            'auth',
            ['channel' => 'email'],
            true
        );

        return response()->json([
            'message' => 'Nouveau code envoye.',
            'verification' => [
                'expires_in_minutes' => $verificationPayload['expires_in_minutes'],
                'code_preview' => $verificationPayload['plain_code'],
            ],
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Compte non active. Verifiez votre code de confirmation.',
            ], 403);
        }

        $user->update([
            'last_login_at' => now(),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('role'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'candidate']);

        return response()->json([
            'user' => $user,
            'unread_notifications' => $user->notifications()->whereNull('read_at')->count(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Deconnexion effectuee.',
        ]);
    }
}
