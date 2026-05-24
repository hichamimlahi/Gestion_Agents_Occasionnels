<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\SalaryCalculation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('role', 'candidate');

        if ($user->role->slug === 'occasionnel') {
            return $this->candidateSummary($user->candidate->id);
        }

        if (in_array($user->role->slug, ['rh', 'naib_rh'], true)) {
            return $this->rhSummary();
        }

        return $this->presidentSummary();
    }

    private function candidateSummary(int $candidateId): JsonResponse
    {
        $applicationsQuery = Application::query()->where('candidate_id', $candidateId);

        return response()->json([
            'role' => 'occasionnel',
            'stats' => [
                'total_applications' => (clone $applicationsQuery)->count(),
                'pending' => (clone $applicationsQuery)->whereIn('status', [
                    Application::STATUS_SUBMITTED,
                    Application::STATUS_RH_REVIEW,
                    Application::STATUS_PRESIDENT_REVIEW,
                ])->count(),
                'approved' => (clone $applicationsQuery)->where('status', Application::STATUS_APPROVED)->count(),
                'rejected' => (clone $applicationsQuery)->where('status', Application::STATUS_REJECTED)->count(),
            ],
        ]);
    }

    private function rhSummary(): JsonResponse
    {
        return response()->json([
            'role' => 'rh',
            'stats' => [
                'submitted' => Application::query()->where('status', Application::STATUS_SUBMITTED)->count(),
                'rh_review' => Application::query()->where('status', Application::STATUS_RH_REVIEW)->count(),
                'president_review' => Application::query()->where('status', Application::STATUS_PRESIDENT_REVIEW)->count(),
                'approved' => Application::query()->where('status', Application::STATUS_APPROVED)->count(),
                'rejected' => Application::query()->where('status', Application::STATUS_REJECTED)->count(),
                'salary_total_net' => round((float) SalaryCalculation::query()->sum('net_amount'), 2),
            ],
        ]);
    }

    private function presidentSummary(): JsonResponse
    {
        return response()->json([
            'role' => 'president',
            'stats' => [
                'pending_approvals' => Application::query()->where('status', Application::STATUS_PRESIDENT_REVIEW)->count(),
                'approved' => Application::query()->where('status', Application::STATUS_APPROVED)->count(),
                'rejected' => Application::query()->where('status', Application::STATUS_REJECTED)->count(),
                'total_processed' => Application::query()->whereIn('status', [
                    Application::STATUS_APPROVED,
                    Application::STATUS_REJECTED,
                    Application::STATUS_FINALIZED,
                ])->count(),
            ],
        ]);
    }
}

