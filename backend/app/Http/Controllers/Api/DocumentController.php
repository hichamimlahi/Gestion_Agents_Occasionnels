<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdministrativeDocument;
use App\Models\Application;
use App\Services\PdfGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(private PdfGenerationService $pdfGenerationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('role', 'candidate');

        $query = AdministrativeDocument::query()
            ->with(['application.candidate.user', 'author'])
            ->latest('generated_at');

        if (in_array($user->role->slug, ['occasionnel'], true)) {
            $query->whereHas('application', function ($subQuery) use ($user): void {
                $subQuery->where('candidate_id', $user->candidate->id);
            });
        }

        return response()->json([
            'documents' => $query->get(),
        ]);
    }

    public function generate(Request $request, Application $application): JsonResponse
    {
        $validated = $request->validate([
            'document_type' => ['required', 'in:engagement,prise_service,decision,affectation,dossier_summary'],
        ]);

        $document = $this->pdfGenerationService->generateForApplication(
            $application,
            $validated['document_type'],
            $request->user()
        );

        return response()->json([
            'message' => 'Document généré.',
            'document' => $document,
        ]);
    }

    public function download(Request $request, AdministrativeDocument $document)
    {
        if (!$this->canAccessDocument($request, $document)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        return response()->download(Storage::disk('local')->path($document->file_path));
    }

    private function canAccessDocument(Request $request, AdministrativeDocument $document): bool
    {
        $user = $request->user()->loadMissing('role', 'candidate');

        if (in_array($user->role->slug, ['rh', 'naib_rh', 'president'], true)) {
            return true;
        }

        return (int) optional($document->application)->candidate_id === (int) optional($user->candidate)->id;
    }
}

