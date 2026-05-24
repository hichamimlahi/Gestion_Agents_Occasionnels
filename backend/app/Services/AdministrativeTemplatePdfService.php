<?php

namespace App\Services;

use App\Models\Application;
use Carbon\Carbon;
use DateTimeInterface;
use RuntimeException;
use setasign\Fpdi\Fpdi;

class AdministrativeTemplatePdfService
{
    private const PT_TO_MM = 25.4 / 72;

    private const TEMPLATE_MAP = [
        'decision' => 'resources/pdf/templates/decision_engagement.pdf',
        'prise_service' => 'resources/pdf/templates/prise_de_service.pdf',
        'engagement' => 'resources/pdf/templates/lettre_engagement.pdf',
        'affectation' => 'resources/pdf/templates/affectation.pdf',
    ];

    public function supports(string $documentType): bool
    {
        return isset(self::TEMPLATE_MAP[$documentType]);
    }

    public function generate(Application $application, string $documentType): string
    {
        $templateRelativePath = self::TEMPLATE_MAP[$documentType] ?? null;
        if (!$templateRelativePath) {
            throw new RuntimeException("Template not found for document type [{$documentType}].");
        }

        $this->ensureFpdfPolyfillsLoaded();

        $templatePath = base_path($templateRelativePath);
        if (!is_file($templatePath)) {
            throw new RuntimeException("Template file missing at path [{$templatePath}].");
        }

        $pdf = new Fpdi();
        $pdf->SetAutoPageBreak(false);

        $pdf->setSourceFile($templatePath);
        $templateId = $pdf->importPage(1);
        $templateSize = $pdf->getTemplateSize($templateId);
        $orientation = ($templateSize['width'] > $templateSize['height']) ? 'L' : 'P';
        $pageHeightPt = $templateSize['height'] / self::PT_TO_MM;

        $pdf->AddPage($orientation, [$templateSize['width'], $templateSize['height']]);
        $pdf->useTemplate($templateId, 0, 0, $templateSize['width'], $templateSize['height']);

        $this->writeFields($pdf, $application, $documentType, $pageHeightPt);

        return $pdf->Output('S');
    }

    private function writeFields(Fpdi $pdf, Application $application, string $documentType, float $pageHeightPt): void
    {
        $candidate = $application->candidate?->user;

        $fullName = trim((string) ($candidate?->full_name ?? ''));
        $firstName = trim((string) ($candidate?->first_name ?? ''));
        $lastName = trim((string) ($candidate?->last_name ?? ''));
        $courtesyName = $this->normalizeText($lastName !== '' ? $lastName : $fullName, 40);
        $birthDate = $this->formatDate($candidate?->birth_date);
        $startDate = $this->formatDate($application->requested_start_date);
        $submittedDate = $this->formatDate($application->submitted_at);
        $approvedDate = $this->formatDate($application->finalized_at);
        $todayDate = now()->format('d/m/Y');
        $duration = $this->resolveDuration($application);
        $salary = $this->resolveSalary($application);
        $serviceLabel = $this->normalizeText(
            (string) ($application->affectation?->service_name ?: $application->desired_position ?: ''),
            60
        );
        $locationLabel = $this->normalizeText(
            (string) ($application->affectation?->location ?: ''),
            60
        );
        $addressLabel = $this->resolveAddress($application);
        $directorName = $this->resolveDirectorName($application);

        if ($documentType === 'decision') {
            $globalShiftPt = $this->cmToPt(0.5);
            $this->drawAtPt(
                $pdf,
                111.15 + $globalShiftPt,
                544.60,
                $this->decisionNumber($application),
                $pageHeightPt,
                11,
                max(10, 110 - $globalShiftPt)
            );
            $this->drawAtPt($pdf, 232.43 + $globalShiftPt, 500.50, $fullName, $pageHeightPt, 11, max(10, 228 - $globalShiftPt));
            $this->drawAtPt($pdf, 163.35 + $globalShiftPt, 462.40, $birthDate, $pageHeightPt, 11, max(10, 309 - $globalShiftPt));
            $this->drawAtPt($pdf, 221.65 + $globalShiftPt, 424.30, $duration, $pageHeightPt, 11, max(10, 255 - $globalShiftPt));
            $this->drawAtPt($pdf, 187.67 + $globalShiftPt, 386.20, $salary, $pageHeightPt, 11, max(10, 291 - $globalShiftPt));
            $this->drawAtPt($pdf, 196.32 + $globalShiftPt, 348.10, $serviceLabel, $pageHeightPt, 11, max(10, 279 - $globalShiftPt));
            $this->drawAtPt($pdf, 407.21 + $globalShiftPt, 289.00, $todayDate, $pageHeightPt, 11, max(10, 120 - $globalShiftPt));

            return;
        }

        if ($documentType === 'prise_service') {
            $globalShiftPt = $this->cmToPt(0.5);

            $this->drawAtPt($pdf, 97.35 + $globalShiftPt, 527.90, $lastName, $pageHeightPt, 11, max(10, 363 - $globalShiftPt));
            $this->drawAtPt($pdf, 113.34 + $globalShiftPt, 491.30, $firstName, $pageHeightPt, 11, max(10, 351 - $globalShiftPt));
            $this->drawAtPt($pdf, 163.35 + $globalShiftPt, 454.70, $birthDate, $pageHeightPt, 11, max(10, 309 - $globalShiftPt));
            $this->drawAtPt($pdf, 254.87 + $globalShiftPt, 418.10, $directorName, $pageHeightPt, 11, max(10, 228 - $globalShiftPt));
            $this->drawAtPt($pdf, 196.01 + $globalShiftPt, 381.50, $startDate, $pageHeightPt, 11, max(10, 279 - $globalShiftPt));
            $this->drawAtPt($pdf, 148.02 + $globalShiftPt, 344.90, $locationLabel, $pageHeightPt, 11, max(10, 324 - $globalShiftPt));
            $this->drawAtPt($pdf, 407.21 + $globalShiftPt, 285.80, $todayDate, $pageHeightPt, 11, max(10, 120 - $globalShiftPt));

            return;
        }

        if ($documentType === 'engagement') {
            $shiftLePt = $this->cmToPt(1.0);
            $shiftMtoPt = $this->cmToPt(1.0);
            $shiftStartPt = $this->cmToPt(3.0);
            $shiftServicePt = $this->cmToPt(3.0);
            $shiftCommunePt = $this->cmToPt(2.0);
            $shiftSalaryPt = $this->cmToPt(2.0);
            $shiftBureauPt = $this->cmToPt(1.3);
            $shiftAgreePt = $this->cmToPt(0.3);
            $shiftPrisePt = $this->cmToPt(1.5);

            $this->drawAtPt($pdf, 128.32 + $shiftLePt, 669.27, $todayDate, $pageHeightPt, 11, max(10, 410 - $shiftLePt));
            $this->drawAtPt($pdf, 70.77 + $shiftMtoPt, 645.27, $fullName, $pageHeightPt, 11, max(10, 300 - $shiftMtoPt));
            $this->drawAtPt($pdf, 85.27, 621.27, $addressLabel, $pageHeightPt, 10.5, 369);
            $this->drawAtPt($pdf, 231.21 + $shiftStartPt, 569.52, $startDate, $pageHeightPt, 11, max(10, 140 - $shiftStartPt));
            $this->drawAtPt($pdf, 206.22 + $shiftServicePt, 553.02, $serviceLabel, $pageHeightPt, 11, max(10, 185 - $shiftServicePt));
            $this->drawAtPt($pdf, 134.30 + $shiftCommunePt, 536.52, $locationLabel, $pageHeightPt, 11, max(10, 270 - $shiftCommunePt));
            $this->drawAtPt($pdf, 56.69 + $shiftSalaryPt, 496.02, $salary, $pageHeightPt, 11, max(10, 250 - $shiftSalaryPt));
            $this->drawAtPt($pdf, 236.50 + $shiftBureauPt, 391.02, $startDate, $pageHeightPt, 11, max(10, 110 - $shiftBureauPt));
            $this->drawAtPt($pdf, 129.71 + $shiftAgreePt, 326.52, $courtesyName, $pageHeightPt, 11, max(10, 70 - $shiftAgreePt));
            $this->drawAtPt($pdf, 148.00 + $shiftPrisePt, 298.77, $startDate, $pageHeightPt, 11, max(10, 152 - $shiftPrisePt));

            return;
        }

        if ($documentType === 'affectation') {
            $defaultShiftPt = $this->cmToPt(0.5);
            $decisionNumberShiftPt = $this->cmToPt(2.0);
            $dateLineShiftPt = $this->cmToPt(1.5);
            $engagementApprovalDateShiftPt = $this->cmToPt(2.5);

            $this->drawAtPt(
                $pdf,
                157.39 + $decisionNumberShiftPt,
                621.08,
                $this->decisionNumber($application),
                $pageHeightPt,
                11,
                max(10, 145 - $decisionNumberShiftPt)
            );
            $this->drawAtPt(
                $pdf,
                78.49 + $dateLineShiftPt,
                602.68,
                $todayDate,
                $pageHeightPt,
                11,
                140
            );
            $this->drawAtPt(
                $pdf,
                62.46 + $defaultShiftPt,
                543.38,
                $submittedDate,
                $pageHeightPt,
                11,
                max(10, 130 - $defaultShiftPt)
            );
            $this->drawAtPt(
                $pdf,
                245.56 + $engagementApprovalDateShiftPt,
                511.48,
                $approvedDate,
                $pageHeightPt,
                11,
                max(10, 168 - $engagementApprovalDateShiftPt)
            );
            $this->drawAtPt($pdf, 194.02 + $defaultShiftPt, 431.53, $fullName, $pageHeightPt, 11, max(10, 218 - $defaultShiftPt));
            $this->drawAtPt($pdf, 153.16 + $defaultShiftPt, 399.63, $birthDate, $pageHeightPt, 11, max(10, 296 - $defaultShiftPt));
            $this->drawAtPt(
                $pdf,
                248.97 + $defaultShiftPt,
                367.73,
                $this->resolveAffectationTarget($application),
                $pageHeightPt,
                11,
                max(10, 210 - $defaultShiftPt)
            );
            $this->drawAtPt($pdf, 199.43 + $defaultShiftPt, 335.83, $startDate, $pageHeightPt, 11, max(10, 262 - $defaultShiftPt));
            $this->drawAtPt($pdf, 418.45 + $defaultShiftPt, 291.18, $todayDate, $pageHeightPt, 11, max(10, 120 - $defaultShiftPt));
        }
    }

    private function drawAtPt(
        Fpdi $pdf,
        float $xPt,
        float $yPt,
        ?string $text,
        float $pageHeightPt,
        float $size,
        ?float $maxWidthPt = null
    ): void
    {
        $clean = $this->normalizeText((string) $text, 120);
        if ($clean === '') {
            return;
        }

        $pdf->SetFont('Arial', '', $size);
        $pdf->SetTextColor(0, 0, 0);
        $textToWrite = $this->fitTextToWidth($pdf, $clean, $maxWidthPt);
        $pdf->Text($this->ptToMm($xPt), $this->ptToMm($pageHeightPt - $yPt), $this->toPdfEncoding($textToWrite));
    }

    private function ptToMm(float $pt): float
    {
        return $pt * self::PT_TO_MM;
    }

    private function cmToPt(float $cm): float
    {
        $millimeters = $cm * 10;

        return $millimeters / self::PT_TO_MM;
    }

    private function toPdfEncoding(string $text): string
    {
        $converted = @iconv('UTF-8', 'windows-1252//TRANSLIT', $text);

        return $converted !== false ? $converted : $text;
    }

    private function formatDate(null|DateTimeInterface|string $date): string
    {
        if ($date === null || $date === '') {
            return '';
        }

        if ($date instanceof DateTimeInterface) {
            return $date->format('d/m/Y');
        }

        try {
            return Carbon::parse($date)->format('d/m/Y');
        } catch (\Throwable $e) {
            return '';
        }
    }

    private function resolveDuration(Application $application): string
    {
        $days = (int) ($application->days_requested ?? 0);
        if ($days <= 0 && $application->requested_start_date && $application->requested_end_date) {
            $days = $application->requested_start_date->diffInDays($application->requested_end_date) + 1;
        }

        return $days > 0 ? "{$days} jours" : '';
    }

    private function resolveSalary(Application $application): string
    {
        $gross = $application->salaryCalculation?->gross_amount;
        if ($gross !== null) {
            return number_format((float) $gross, 2, ',', ' ') . ' DH';
        }

        $dayRate = $application->salaryCalculation?->day_rate;
        if ($dayRate !== null) {
            return number_format((float) $dayRate, 2, ',', ' ') . ' DH / jour';
        }

        return '';
    }

    private function resolveAddress(Application $application): string
    {
        $address = trim((string) ($application->candidate?->address ?? ''));
        $city = trim((string) ($application->candidate?->city ?? ''));
        $label = trim($address . ' ' . $city);

        return $this->normalizeText($label, 85);
    }

    private function resolveDirectorName(Application $application): string
    {
        $approval = $application->approvals
            ->first(function ($item): bool {
                return in_array($item->reviewer?->role?->slug, ['rh', 'naib_rh'], true);
            });

        return $this->normalizeText((string) ($approval?->reviewer?->full_name ?? ''), 60);
    }

    private function resolveAffectationTarget(Application $application): string
    {
        $location = trim((string) ($application->affectation?->location ?? ''));
        $service = trim((string) ($application->affectation?->service_name ?? ''));
        if ($location !== '' && $service !== '') {
            return $this->normalizeText("{$location} / {$service}", 65);
        }

        if ($location !== '') {
            return $this->normalizeText($location, 65);
        }

        if ($service !== '') {
            return $this->normalizeText($service, 65);
        }

        return $this->normalizeText((string) ($application->desired_position ?? ''), 65);
    }

    private function decisionNumber(Application $application): string
    {
        $reference = trim((string) $application->reference);
        if ($reference !== '') {
            if (preg_match('/(\d{1,8})$/', $reference, $matches) === 1) {
                return $matches[1];
            }

            $parts = preg_split('/[-\s\/]+/', $reference);
            if (is_array($parts) && $parts !== []) {
                return (string) end($parts);
            }

            return $reference;
        }

        return sprintf('%04d', (int) $application->id);
    }

    private function normalizeText(string $text, int $maxLength): string
    {
        $compact = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
        if ($compact === '') {
            return '';
        }

        if (mb_strlen($compact) <= $maxLength) {
            return $compact;
        }

        return mb_substr($compact, 0, max(0, $maxLength - 3)) . '...';
    }

    private function fitTextToWidth(Fpdi $pdf, string $text, ?float $maxWidthPt): string
    {
        if ($maxWidthPt === null || $maxWidthPt <= 0) {
            return $text;
        }

        $maxWidthMm = $this->ptToMm($maxWidthPt);
        $candidate = $text;

        while ($candidate !== '') {
            $encoded = $this->toPdfEncoding($candidate);
            if ($pdf->GetStringWidth($encoded) <= $maxWidthMm) {
                return $candidate;
            }

            if (mb_strlen($candidate) <= 3) {
                break;
            }

            $candidate = rtrim(mb_substr($candidate, 0, mb_strlen($candidate) - 1));
        }

        return '';
    }

    private function ensureFpdfPolyfillsLoaded(): void
    {
        require_once base_path('bootstrap/fpdf_polyfills.php');
    }
}
