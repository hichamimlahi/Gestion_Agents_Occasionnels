<?php

namespace App\Services;

use Carbon\Carbon;
use Carbon\CarbonPeriod;

class SalaryCalculationService
{
    private const BRUT_PER_DAY = 97.44;
    private const RCAR_PER_DAY = 5.85;
    private const NET_PER_DAY = 91.59;
    private const RCAR_RATE = 6.00;
    private const SEASON_DAYS_2026 = [
        'Période 1 : Janvier, Février, Mars' => [
            'worked_days' => 61,
            'non_working_days' => 29,
        ],
        'Période 2 : Avril, Mai, Juin' => [
            'worked_days' => 61,
            'non_working_days' => 30,
        ],
        'Période 3 : Juillet, Août, Septembre' => [
            'worked_days' => 61,
            'non_working_days' => 31,
        ],
        'Période 4 : Octobre, Novembre, Décembre' => [
            'worked_days' => 64,
            'non_working_days' => 28,
        ],
    ];

    public function calculateWorkedDays(Carbon $startDate, Carbon $endDate): array
    {
        $workedDays = 0;
        $nonWorkingDays = 0;

        foreach (CarbonPeriod::create($startDate, $endDate) as $day) {
            if (in_array($day->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY], true)) {
                $nonWorkingDays++;
                continue;
            }

            $workedDays++;
        }

        return [
            'worked_days' => $workedDays,
            'non_working_days' => $nonWorkingDays,
        ];
    }

    public function resolveSeasonDays(?string $seasonLabel): ?array
    {
        if (!$seasonLabel) {
            return null;
        }

        $normalizedSeason = $this->normalizeSeasonLabel($seasonLabel);
        foreach (self::SEASON_DAYS_2026 as $label => $payload) {
            if ($this->normalizeSeasonLabel($label) === $normalizedSeason) {
                return $payload;
            }
        }

        return null;
    }

    public function calculateAmounts(int $workedDays, Carbon $contractStartDate): array
    {
        $grossAmount = self::BRUT_PER_DAY * $workedDays;
        $rcarAmount = self::RCAR_PER_DAY * $workedDays;
        $netAmount = self::NET_PER_DAY * $workedDays;

        return [
            'worked_days' => $workedDays,
            'day_rate' => round(self::BRUT_PER_DAY, 2),
            'gross_amount' => round($grossAmount, 4),
            'rcar_rate' => self::RCAR_RATE,
            'rcar_amount' => round($rcarAmount, 4),
            'net_amount' => round($netAmount, 4),
        ];
    }

    private function normalizeSeasonLabel(string $seasonLabel): string
    {
        $normalized = mb_strtolower(trim($seasonLabel));
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? '';

        return strtr($normalized, [
            'é' => 'e',
            'è' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'à' => 'a',
            'â' => 'a',
            'ä' => 'a',
            'î' => 'i',
            'ï' => 'i',
            'ô' => 'o',
            'ö' => 'o',
            'ù' => 'u',
            'û' => 'u',
            'ü' => 'u',
            'ç' => 'c',
        ]);
    }
}

