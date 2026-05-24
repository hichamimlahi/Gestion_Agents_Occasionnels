<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\SalaryCalculation;
use Carbon\Carbon;

class ApplicationWorkflowService
{
    private const REQUIRED_DOCUMENT_TYPES = [
        'cin',
        'cv',
        'lettre_demande',
        'photo',
    ];

    public function __construct(
        private SalaryCalculationService $salaryCalculationService,
        private WorkPeriodComplianceService $workPeriodComplianceService
    ) {
    }

    public function createDraft(Candidate $candidate, array $payload): Application
    {
        $age = Carbon::parse($candidate->user->birth_date)->age;

        $application = Application::create([
            'candidate_id' => $candidate->id,
            'reference' => $this->generateReference(),
            'season_label' => $payload['season_label'] ?? null,
            'desired_position' => $payload['desired_position'] ?? null,
            'requested_start_date' => null,
            'requested_end_date' => null,
            'status' => Application::STATUS_DRAFT,
            'current_step' => 'dossier',
            'days_requested' => 0,
            'age_at_submission' => $age,
            'is_age_eligible' => $this->isAgeEligible($age),
            'requires_consultation' => false,
            'alerts' => [],
        ]);

        return $application;
    }

    public function submit(Application $application): array
    {
        $missingDocuments = $this->missingRequiredDocuments($application);

        if ($missingDocuments !== []) {
            return [
                'ok' => false,
                'message' => 'Missing required documents.',
                'missing_documents' => $missingDocuments,
            ];
        }

        $application->update([
            'status' => Application::STATUS_SUBMITTED,
            'current_step' => 'rh_validation',
            'submitted_at' => now(),
        ]);

        return [
            'ok' => true,
            'message' => 'Application submitted successfully.',
        ];
    }

    public function createOrUpdateSalaryCalculation(Application $application): SalaryCalculation
    {
        $startDate = $application->requested_start_date
            ? Carbon::parse($application->requested_start_date)
            : Carbon::now();

        $workedDays = max(0, (int) $application->days_requested);

        $amounts = $this->salaryCalculationService->calculateAmounts($workedDays, $startDate);

        return SalaryCalculation::updateOrCreate(
            ['application_id' => $application->id],
            [
                'worked_days' => $amounts['worked_days'],
                'day_rate' => $amounts['day_rate'],
                'gross_amount' => $amounts['gross_amount'],
                'rcar_rate' => $amounts['rcar_rate'],
                'rcar_amount' => $amounts['rcar_amount'],
                'net_amount' => $amounts['net_amount'],
                'calculated_at' => now(),
            ]
        );
    }

    public function assignAdministrativePeriod(
        Application $application,
        string $assignedStartDate,
        string $assignedEndDate
    ): Application {
        $candidate = $application->candidate;
        $startDate = Carbon::parse($assignedStartDate);
        $endDate = Carbon::parse($assignedEndDate);
        $daysPayload = $this->salaryCalculationService->calculateWorkedDays($startDate, $endDate);
        $seasonDaysPayload = $this->salaryCalculationService->resolveSeasonDays($application->season_label);
        if ($seasonDaysPayload !== null) {
            $daysPayload = [
                'worked_days' => (int) $seasonDaysPayload['worked_days'],
                'non_working_days' => (int) $seasonDaysPayload['non_working_days'],
            ];
        }

        $compliance = $this->workPeriodComplianceService->evaluateReapplication($candidate, $startDate);

        $alerts = is_array($application->alerts) ? $application->alerts : [];
        $alerts = array_merge($alerts, $compliance['alerts']);
        if ($daysPayload['non_working_days'] > 0) {
            $alerts[] = sprintf(
                '%d non-working days excluded from salary calculation.',
                $daysPayload['non_working_days']
            );
        }

        $application->update([
            'requested_start_date' => $startDate->toDateString(),
            'requested_end_date' => $endDate->toDateString(),
            'days_requested' => $daysPayload['worked_days'],
            'requires_consultation' => $compliance['requires_consultation'],
            'alerts' => array_values(array_unique($alerts)),
        ]);

        $existingPeriod = $candidate->workPeriods()
            ->where('application_id', $application->id)
            ->first();

        if ($existingPeriod) {
            $existingPeriod->update([
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'worked_days' => $daysPayload['worked_days'],
                'non_working_days' => $daysPayload['non_working_days'],
                'is_compliant' => !$compliance['requires_consultation'],
                'compliance_note' => $compliance['requires_consultation']
                    ? 'Requires RH consultation with President.'
                    : null,
            ]);
        } else {
            $this->workPeriodComplianceService->createWorkPeriodSnapshot(
                $candidate,
                $application->id,
                $startDate,
                $endDate,
                $daysPayload['worked_days'],
                $daysPayload['non_working_days'],
                !$compliance['requires_consultation'],
                $compliance['requires_consultation']
                    ? 'Requires RH consultation with President.'
                    : null
            );
        }

        return $application->fresh();
    }

    public function isAgeEligible(int $age): bool
    {
        return $age > 18 && $age < 60;
    }

    public function missingRequiredDocuments(Application $application): array
    {
        $uploadedTypes = $application->uploadedDocuments()
            ->pluck('document_type')
            ->all();

        return array_values(array_diff(self::REQUIRED_DOCUMENT_TYPES, $uploadedTypes));
    }

    private function generateReference(): string
    {
        $latestId = (int) Application::query()->max('id') + 1;

        return sprintf('LAR-%s-%04d', now()->year, $latestId);
    }
}

