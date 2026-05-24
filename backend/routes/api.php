<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PresidentStaffController;
use App\Http\Controllers\Api\PresidentWorkflowController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\RhWorkflowController;
use Illuminate\Support\Facades\Route;

Route::prefix('public')->group(function (): void {
    Route::get('/home', [PublicController::class, 'home']);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-code', [AuthController::class, 'verifyCode']);
    Route::post('/resend-code', [AuthController::class, 'resendCode']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/profile/photo', [ProfileController::class, 'photo']);

    Route::prefix('candidate')->middleware('role:occasionnel')->group(function (): void {
        Route::get('/profile', [CandidateController::class, 'profile']);
        Route::put('/profile', [CandidateController::class, 'updateProfile']);
    });

    Route::prefix('applications')->group(function (): void {
        Route::get('/', [ApplicationController::class, 'index']);
        Route::get('/users/{user}/photo', [ApplicationController::class, 'userPhoto'])->middleware('role:rh,naib_rh,president');
        Route::post('/', [ApplicationController::class, 'store'])->middleware('role:occasionnel');
        Route::get('/{application}', [ApplicationController::class, 'show']);
        Route::post('/{application}/upload-document', [ApplicationController::class, 'uploadDocument']);
        Route::get('/{application}/documents/{document}/download', [ApplicationController::class, 'downloadDocument']);
        Route::delete('/{application}/documents/{document}', [ApplicationController::class, 'deleteDocument']);
        Route::post('/{application}/submit', [ApplicationController::class, 'submit'])->middleware('role:occasionnel');
    });

    Route::prefix('documents')->group(function (): void {
        Route::get('/', [DocumentController::class, 'index']);
        Route::post('/{application}/generate', [DocumentController::class, 'generate'])->middleware('role:rh,naib_rh,president');
        Route::get('/{document}/download', [DocumentController::class, 'download']);
    });

    Route::prefix('rh')->middleware('role:rh,naib_rh')->group(function (): void {
        Route::get('/queue', [RhWorkflowController::class, 'queue']);
        Route::patch('/applications/{application}/documents/{document}', [RhWorkflowController::class, 'validateDocument']);
        Route::post('/applications/{application}/send-to-president', [RhWorkflowController::class, 'sendToPresident']);
        Route::post('/applications/{application}/finalize', [RhWorkflowController::class, 'finalize']);
    });

    Route::prefix('president')->middleware('role:president')->group(function (): void {
        Route::get('/pending', [PresidentWorkflowController::class, 'pending']);
        Route::post('/applications/{application}/decide', [PresidentWorkflowController::class, 'decide']);
        Route::get('/staff', [PresidentStaffController::class, 'index']);
        Route::get('/staff/{user}/photo', [PresidentStaffController::class, 'photo']);
        Route::post('/staff', [PresidentStaffController::class, 'store']);
        Route::put('/staff/{user}', [PresidentStaffController::class, 'update']);
        Route::delete('/staff/{user}', [PresidentStaffController::class, 'destroy']);
    });

    Route::prefix('notifications')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index']);
        Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);
    });
});
