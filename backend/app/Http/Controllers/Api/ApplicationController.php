<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\UploadedDocument;
use App\Models\User;
use App\Services\ApplicationWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ApplicationController extends Controller
{
    private const ALLOWED_SEASON_LABELS = [
        'Période 1 : Janvier, Février, Mars',
        'Période 2 : Avril, Mai, Juin',
        'Période 3 : Juillet, Août, Septembre',
        'Période 4 : Octobre, Novembre, Décembre',
    ];

    public function __construct(private ApplicationWorkflowService $applicationWorkflowService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('role', 'candidate');

        $query = Application::query()->with([
            'candidate.user',
            'uploadedDocuments',
            'salaryCalculation',
            'affectation',
            'approvals.reviewer.role',
        ])->latest('id');

        if (in_array($user->role->slug, ['occasionnel'], true)) {
            $query->where('candidate_id', $user->candidate->id);
        }

        return response()->json([
            'applications' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'season_label' => ['required', 'string', Rule::in(self::ALLOWED_SEASON_LABELS)],
            'desired_position' => ['required', 'string', 'max:160'],
        ]);

        $candidate = $request->user()->candidate;

        if (!$candidate) {
            return response()->json([
                'message' => 'Candidate profile missing.',
            ], 422);
        }

        $application = $this->applicationWorkflowService->createDraft($candidate, $validated);

        return response()->json([
            'message' => 'Demande creee en brouillon.',
            'application' => $application->load('uploadedDocuments'),
        ], 201);
    }

    public function show(Request $request, Application $application): JsonResponse
    {
        if (!$this->canAccessApplication($request, $application)) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        return response()->json([
            'application' => $application->load([
                'candidate.user',
                'uploadedDocuments',
                'salaryCalculation',
                'administrativeDocuments',
                'affectation',
                'approvals.reviewer.role',
                'workPeriods',
            ]),
        ]);
    }

    public function uploadDocument(Request $request, Application $application): JsonResponse
    {
        if (!$this->canAccessApplication($request, $application)) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        $validated = $request->validate([
            'document_type' => ['required', 'in:cin,cv,lettre_demande,photo,permis,diplome'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $file = $request->file('file');
        $storedPath = $file->storeAs(
            'applications/' . $application->id,
            $validated['document_type'] . '_' . now()->format('Ymd_His') . '.pdf',
            'local'
        );

        $document = UploadedDocument::updateOrCreate(
            [
                'application_id' => $application->id,
                'document_type' => $validated['document_type'],
            ],
            [
                'candidate_id' => $application->candidate_id,
                'original_name' => $file->getClientOriginalName(),
                'stored_path' => $storedPath,
                'mime_type' => $file->getClientMimeType() ?? 'application/pdf',
                'file_size' => $file->getSize(),
                'validation_status' => 'pending',
                'validated_by' => null,
                'validated_at' => null,
                'rejection_reason' => null,
            ]
        );

        return response()->json([
            'message' => 'Document uploade avec succes.',
            'document' => $document,
        ]);
    }

    public function downloadDocument(Request $request, Application $application, UploadedDocument $document)
    {
        if (!$this->canAccessApplication($request, $application) || $document->application_id !== $application->id) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        if (!Storage::disk('local')->exists($document->stored_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        return response()->download(
            Storage::disk('local')->path($document->stored_path),
            $document->original_name
        );
    }

    public function submit(Request $request, Application $application): JsonResponse
    {
        if (!$this->canAccessApplication($request, $application)) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        $result = $this->applicationWorkflowService->submit($application);

        if (!$result['ok']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function deleteDocument(Request $request, Application $application, UploadedDocument $document): JsonResponse
    {
        if (!$this->canAccessApplication($request, $application) || $document->application_id !== $application->id) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        Storage::disk('local')->delete($document->stored_path);
        $document->delete();

        return response()->json([
            'message' => 'Document supprime.',
        ]);
    }

    public function userPhoto(User $user): BinaryFileResponse|JsonResponse
    {
        if (optional($user->role)->slug !== 'occasionnel') {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        if (empty($user->profile_photo_path) || !Storage::disk('local')->exists($user->profile_photo_path)) {
            return response()->json(['message' => 'Profile photo not found.'], 404);
        }

        return response()->file(Storage::disk('local')->path($user->profile_photo_path), [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    private function canAccessApplication(Request $request, Application $application): bool
    {
        $user = $request->user()->loadMissing('role', 'candidate');

        if (in_array($user->role->slug, ['rh', 'naib_rh', 'president'], true)) {
            return true;
        }

        return (int) $application->candidate_id === (int) optional($user->candidate)->id;
    }
}
