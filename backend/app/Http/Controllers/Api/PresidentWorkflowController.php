<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Approval;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresidentWorkflowController extends Controller
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    public function pending(): JsonResponse
    {
        $applications = Application::query()
            ->with(['candidate.user', 'uploadedDocuments', 'approvals.reviewer.role'])
            ->where('status', Application::STATUS_PRESIDENT_REVIEW)
            ->latest('rh_reviewed_at')
            ->get();

        return response()->json([
            'applications' => $applications,
        ]);
    }

    public function decide(Request $request, Application $application): JsonResponse
    {
        if ($application->status !== Application::STATUS_PRESIDENT_REVIEW) {
            return response()->json([
                'message' => 'Cette demande n\'est pas en attente de décision Président.',
            ], 422);
        }

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'comment' => ['nullable', 'string'],
        ]);

        Approval::create([
            'application_id' => $application->id,
            'reviewer_id' => $request->user()->id,
            'role_snapshot' => 'president',
            'decision' => $validated['decision'],
            'comment' => $validated['comment'] ?? null,
            'decided_at' => now(),
        ]);

        $application->update([
            'status' => $validated['decision'] === 'approved'
                ? Application::STATUS_APPROVED
                : Application::STATUS_REJECTED,
            'current_step' => 'rh_finalization',
            'president_reviewed_at' => now(),
            'president_comment' => $validated['comment'] ?? null,
        ]);

        $decisionLabel = $validated['decision'] === 'approved' ? 'acceptée' : 'rejetée';
        $this->notificationService->notify(
            $application->candidate->user,
            'Décision du Président',
            "Votre dossier a été {$decisionLabel} par le Président et transmis au RH pour finalisation.",
            'application',
            ['application_id' => $application->id],
            true
        );

        return response()->json([
            'message' => 'Décision enregistrée.',
            'application' => $application->fresh()->load('approvals.reviewer.role'),
        ]);
    }
}

