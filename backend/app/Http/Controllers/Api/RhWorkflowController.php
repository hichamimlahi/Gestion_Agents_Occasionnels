<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Application;
use App\Models\Approval;
use App\Models\UploadedDocument;
use App\Services\ApplicationWorkflowService;
use App\Services\NotificationService;
use App\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhWorkflowController extends Controller
{
    public function __construct(
        private ApplicationWorkflowService $applicationWorkflowService,
        private PdfGenerationService $pdfGenerationService,
        private NotificationService $notificationService
    ) {
    }

    public function queue(): JsonResponse
    {
        $applications = Application::query()
            ->with(['candidate.user', 'uploadedDocuments', 'salaryCalculation', 'approvals.reviewer.role'])
            ->whereIn('status', [
                Application::STATUS_SUBMITTED,
                Application::STATUS_RH_REVIEW,
                Application::STATUS_PRESIDENT_REVIEW,
                Application::STATUS_APPROVED,
                Application::STATUS_REJECTED,
                Application::STATUS_ON_HOLD,
            ])
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'applications' => $applications,
        ]);
    }

    public function validateDocument(Request $request, Application $application, UploadedDocument $document): JsonResponse
    {
        if ($document->application_id !== $application->id) {
            return response()->json(['message' => 'Document mismatch.'], 422);
        }

        $validated = $request->validate([
            'validation_status' => ['required', 'in:valid,rejected'],
            'rejection_reason' => ['nullable', 'string', 'required_if:validation_status,rejected'],
        ]);

        $document->update([
            'validation_status' => $validated['validation_status'],
            'validated_by' => $request->user()->id,
            'validated_at' => now(),
            'rejection_reason' => $validated['validation_status'] === 'rejected'
                ? ($validated['rejection_reason'] ?? 'Document rejected by RH.')
                : null,
        ]);

        $application->update([
            'status' => Application::STATUS_RH_REVIEW,
            'current_step' => 'rh_validation',
        ]);

        return response()->json([
            'message' => 'Validation du document enregistree.',
            'document' => $document,
        ]);
    }

    public function sendToPresident(Request $request, Application $application): JsonResponse
    {
        if (!$application->is_age_eligible) {
            return response()->json([
                'message' => "RH ne peut pas valider un candidat hors limite d'age (strictement entre 18 et 60 ans).",
            ], 422);
        }

        $application->update([
            'status' => Application::STATUS_PRESIDENT_REVIEW,
            'current_step' => 'president_decision',
            'rh_reviewed_at' => now(),
        ]);

        Approval::create([
            'application_id' => $application->id,
            'reviewer_id' => $request->user()->id,
            'role_snapshot' => $request->user()->role->slug,
            'decision' => 'pending',
            'comment' => 'Dossier transfere au President.',
        ]);

        return response()->json([
            'message' => 'Demande transferee au President.',
            'application' => $application,
        ]);
    }

    public function finalize(Request $request, Application $application): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'final_note' => ['nullable', 'string'],
            'assigned_start_date' => ['nullable', 'date', 'required_if:decision,approved'],
            'assigned_end_date' => ['nullable', 'date', 'after_or_equal:assigned_start_date', 'required_if:decision,approved'],
            'affectation_location' => ['nullable', 'string', 'required_if:decision,approved'],
            'affectation_service' => ['nullable', 'string'],
        ]);

        $presidentDecision = $application->approvals()
            ->where('role_snapshot', 'president')
            ->whereIn('decision', ['approved', 'rejected'])
            ->latest('id')
            ->first();

        if (!$presidentDecision || $presidentDecision->decision !== $validated['decision']) {
            return response()->json([
                'message' => 'La decision finale doit correspondre a la decision du President.',
            ], 422);
        }

        if ($validated['decision'] === 'approved') {
            $application = $this->applicationWorkflowService->assignAdministrativePeriod(
                $application,
                (string) $validated['assigned_start_date'],
                (string) $validated['assigned_end_date']
            );

            $application->update([
                'status' => Application::STATUS_APPROVED,
                'current_step' => 'finalization',
                'finalized_at' => now(),
                'rh_decision_note' => $validated['final_note'] ?? null,
            ]);

            $this->applicationWorkflowService->createOrUpdateSalaryCalculation($application);

            Affectation::updateOrCreate(
                ['application_id' => $application->id],
                [
                    'location' => $validated['affectation_location'] ?? 'A determiner',
                    'service_name' => $validated['affectation_service'] ?? null,
                    'start_date' => $application->requested_start_date,
                    'end_date' => $application->requested_end_date,
                ]
            );

            $application->load('affectation');
            $this->pdfGenerationService->generateAcceptedDocuments($application, $request->user());

            $this->notificationService->notify(
                $application->candidate->user,
                'Demande acceptee',
                'Votre demande a ete acceptee et finalisee par l\'administration RH.',
                'application',
                ['application_id' => $application->id],
                true
            );
        } else {
            $application->update([
                'status' => Application::STATUS_REJECTED,
                'current_step' => 'finalization',
                'finalized_at' => now(),
                'rh_decision_note' => $validated['final_note'] ?? null,
            ]);

            $this->notificationService->notify(
                $application->candidate->user,
                'Demande rejetee',
                'Votre demande a ete rejetee apres decision finale.',
                'application',
                ['application_id' => $application->id],
                true
            );
        }

        return response()->json([
            'message' => 'Processus RH finalise.',
            'application' => $application->fresh()->load([
                'salaryCalculation',
                'affectation',
                'administrativeDocuments',
            ]),
        ]);
    }
}
