<?php

namespace App\Services;

use App\Models\AdministrativeDocument;
use App\Models\Application;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfGenerationService
{
    public function __construct(private AdministrativeTemplatePdfService $templatePdfService)
    {
    }

    public function generateForApplication(Application $application, string $documentType, ?User $generatedBy = null): AdministrativeDocument
    {
        $application->loadMissing([
            'candidate.user.role',
            'salaryCalculation',
            'affectation',
            'approvals.reviewer.role',
            'uploadedDocuments',
        ]);

        if ($this->templatePdfService->supports($documentType)) {
            $pdfBinary = $this->templatePdfService->generate($application, $documentType);
        } else {
            $pdf = Pdf::loadView('pdf.administrative-document', [
                'documentType' => $documentType,
                'application' => $application,
                'generatedAt' => Carbon::now(),
            ]);

            $pdfBinary = $pdf->output();
        }

        $safeReference = Str::slug($application->reference);
        $fileName = sprintf('%s_%s_%s.pdf', $documentType, $safeReference, now()->format('Ymd_His'));
        $path = 'documents/' . $fileName;

        Storage::disk('local')->put($path, $pdfBinary);

        return AdministrativeDocument::updateOrCreate(
            [
                'application_id' => $application->id,
                'document_type' => $documentType,
            ],
            [
                'file_path' => $path,
                'generated_by' => $generatedBy?->id,
                'generated_at' => Carbon::now(),
                'status' => 'generated',
            ]
        );
    }

    public function generateAcceptedDocuments(Application $application, ?User $generatedBy = null): void
    {
        $baseTypes = ['engagement', 'prise_service', 'decision', 'dossier_summary'];

        foreach ($baseTypes as $type) {
            $this->generateForApplication($application, $type, $generatedBy);
        }

        if ($application->affectation) {
            $this->generateForApplication($application, 'affectation', $generatedBy);
        }
    }

    public function generateDossierSummary(Application $application, ?User $generatedBy = null): AdministrativeDocument
    {
        return $this->generateForApplication($application, 'dossier_summary', $generatedBy);
    }
}

