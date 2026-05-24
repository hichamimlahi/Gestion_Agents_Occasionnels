<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Candidate;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function home(): JsonResponse
    {
        $stats = [
            'total_candidates' => Candidate::query()->count(),
            'submitted_applications' => Application::query()->where('status', Application::STATUS_SUBMITTED)->count(),
            'approved_applications' => Application::query()->where('status', Application::STATUS_APPROVED)->count(),
            'pending_president' => Application::query()->where('status', Application::STATUS_PRESIDENT_REVIEW)->count(),
        ];

        return response()->json([
            'hero' => [
                'title' => 'Gestion des dossier des agents occasionnels - Commune de Larache',
                'subtitle' => 'Plateforme digitale pour la gestion, la validation et le suivi des dossiers des occasionnels.',
            ],
            'stats' => $stats,
            'faq' => [
                [
                    'q' => 'Qui peut deposer une demande ?',
                    'a' => 'Toute personne disposant d\'un compte verifie.',
                ],
                [
                    'q' => 'Quels formats sont acceptes ?',
                    'a' => 'Uniquement les fichiers PDF pour tous les documents.',
                ],
                [
                    'q' => 'Comment est calcule le salaire ?',
                    'a' => 'Calcul fixe: BRUT = jours x 97,44 DH, RCAR = jours x 5,85 DH, NET = jours x 91,59 DH.',
                ],
            ],
            'steps' => [
                'Creation du compte',
                'Completer le dossier PDF',
                'Validation RH',
                'Decision du President',
                'Generation des documents administratifs',
            ],
            'summer_season' => [
                'start_date' => '2026-06-21',
                'end_date' => '2026-09-15',
                'approx_worked_days' => 62,
            ],
        ]);
    }
}
