<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\WorkPeriod;
use Carbon\Carbon;

class WorkPeriodComplianceService
{
    public function evaluateReapplication(Candidate $candidate, Carbon $requestedStartDate): array
    {
        $alerts = [];
        $requiresConsultation = false;

        $lastPeriod = $candidate->workPeriods()
            ->where('is_completed', true)
            ->orderByDesc('end_date')
            ->first();

        if (!$lastPeriod) {
            return [
                'requires_consultation' => false,
                'alerts' => [],
            ];
        }

        $lastEndDate = Carbon::parse($lastPeriod->end_date);
        $gapDays = $lastEndDate->diffInDays($requestedStartDate, false) - 1;
        $crossedThreeMonths = $this->periodReachedThreeMonths($lastPeriod);

        if ($gapDays < 0) {
            $requiresConsultation = true;
            $alerts[] = 'Overlap detected with previous work period.';
        }

        if ($crossedThreeMonths && $gapDays < 10) {
            $requiresConsultation = true;
            $alerts[] = 'Mandatory stop period (10 to 15 days) not respected after 3 months.';
        }

        if ($crossedThreeMonths && $gapDays >= 10 && $gapDays <= 15) {
            $alerts[] = 'Mandatory stop period respected.';
        }

        return [
            'requires_consultation' => $requiresConsultation,
            'alerts' => $alerts,
        ];
    }

    public function createWorkPeriodSnapshot(
        Candidate $candidate,
        int $applicationId,
        Carbon $startDate,
        Carbon $endDate,
        int $workedDays,
        int $nonWorkingDays,
        bool $isCompliant,
        ?string $complianceNote = null
    ): WorkPeriod {
        return WorkPeriod::create([
            'candidate_id' => $candidate->id,
            'application_id' => $applicationId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'worked_days' => $workedDays,
            'non_working_days' => $nonWorkingDays,
            'is_compliant' => $isCompliant,
            'compliance_note' => $complianceNote,
            'is_completed' => false,
        ]);
    }

    private function periodReachedThreeMonths(WorkPeriod $period): bool
    {
        if ((int) $period->worked_days >= 90) {
            return true;
        }

        $start = Carbon::parse($period->start_date);
        $end = Carbon::parse($period->end_date);

        return $start->diffInDays($end) + 1 >= 90;
    }
}

