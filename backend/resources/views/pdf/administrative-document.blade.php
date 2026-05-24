<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #102a43;
            background: #f6f0e5;
            margin: 0;
            padding: 24px;
            font-size: 12px;
        }
        .page {
            border: 1px solid #d4af37;
            background: #fffefb;
            padding: 24px;
            position: relative;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #163a5f;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 4px;
            color: #163a5f;
        }
        .subtitle {
            font-size: 12px;
            color: #6b7280;
        }
        .section {
            margin-bottom: 12px;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #163a5f;
            margin-bottom: 6px;
        }
        .row {
            margin: 4px 0;
        }
        .label {
            display: inline-block;
            width: 180px;
            color: #374151;
            font-weight: bold;
        }
        .value {
            color: #111827;
        }
        .signature-grid {
            margin-top: 28px;
            display: table;
            width: 100%;
        }
        .signature-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
        }
        .signature-line {
            margin: 36px auto 0;
            width: 80%;
            border-top: 1px solid #9ca3af;
            padding-top: 6px;
            font-size: 11px;
        }
        .badge {
            display: inline-block;
            background: #163a5f;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        .notice-section {
            margin-top: 14px;
            padding: 10px 12px;
            border: 1px solid #d4af37;
            background: #fff7e2;
            border-radius: 6px;
        }
        .notice-text {
            margin: 0;
            font-size: 11.5px;
            line-height: 1.5;
            color: #4a2f07;
            font-weight: 600;
        }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div>Royaume du Maroc</div>
        <div>Commune de Larache</div>
        <div class="title">Gestion des dossier des agents occasionnels</div>
        <div class="subtitle">Document administratif - {{ strtoupper($documentType) }}</div>
        <div class="subtitle">Genere le {{ $generatedAt->format('d/m/Y H:i') }}</div>
    </div>

    <div class="section">
        <div class="section-title">Reference du dossier</div>
        <div class="badge">{{ $application->reference }}</div>
    </div>

    <div class="section">
        <div class="section-title">Informations du candidat</div>
        <div class="row"><span class="label">Nom complet:</span><span class="value">{{ $application->candidate->user->full_name }}</span></div>
        <div class="row"><span class="label">CIN:</span><span class="value">{{ $application->candidate->user->cin }}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">{{ $application->candidate->user->email }}</span></div>
        <div class="row"><span class="label">Telephone:</span><span class="value">{{ $application->candidate->user->phone }}</span></div>
    </div>

    <div class="section">
        <div class="section-title">Periode de travail</div>
        <div class="row"><span class="label">Fonction:</span><span class="value">{{ $application->desired_position }}</span></div>
        <div class="row"><span class="label">Date debut:</span><span class="value">{{ optional($application->requested_start_date)->format('d/m/Y') }}</span></div>
        <div class="row"><span class="label">Date fin:</span><span class="value">{{ optional($application->requested_end_date)->format('d/m/Y') }}</span></div>
        <div class="row"><span class="label">Jours travailles:</span><span class="value">{{ $application->days_requested }}</span></div>
    </div>

    <div class="section">
        <div class="section-title">Details salariaux</div>
        <div class="row"><span class="label">Salaire/jour:</span><span class="value">{{ optional($application->salaryCalculation)->day_rate }} DH</span></div>
        <div class="row"><span class="label">Brut:</span><span class="value">{{ optional($application->salaryCalculation)->gross_amount }} DH</span></div>
        <div class="row"><span class="label">RCAR:</span><span class="value">{{ optional($application->salaryCalculation)->rcar_amount }} DH</span></div>
        <div class="row"><span class="label">Net:</span><span class="value">{{ optional($application->salaryCalculation)->net_amount }} DH</span></div>
    </div>

    @if($application->affectation)
    <div class="section">
        <div class="section-title">Affectation</div>
        <div class="row"><span class="label">Lieu:</span><span class="value">{{ $application->affectation->location }}</span></div>
        <div class="row"><span class="label">Fonction:</span><span class="value">{{ $application->affectation->service_name }}</span></div>
    </div>
    @endif

    <div class="signature-grid">
        <div class="signature-cell">
            <div class="signature-line">Signature Occasionnel</div>
        </div>
        <div class="signature-cell">
            <div class="signature-line">Signature RH</div>
        </div>
        <div class="signature-cell">
            <div class="signature-line">Signature President</div>
        </div>
    </div>

    @if($documentType === 'dossier_summary')
    <div class="notice-section">
        <p class="notice-text">
            Le candidat doit se presenter a la Commune dans un delai maximum de 10 jours a compter de la date de notification.
            Passe ce delai, le dossier sera annule automatiquement.
        </p>
    </div>
    @endif
</div>
</body>
</html>
