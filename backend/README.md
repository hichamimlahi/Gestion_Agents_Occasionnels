# Gestion des dossier des agents occasionnels - Backend API (Laravel)

API REST pour la plateforme `Gestion des dossier des agents occasionnels - Commune de Larache`.

## Stack
- Laravel 9
- Sanctum (Bearer token)
- MySQL
- DomPDF

## Installation
```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configurer `.env`:
- `DB_DATABASE=gestion_occasionnels`
- `DB_USERNAME`, `DB_PASSWORD`

Puis:
```bash
php artisan migrate --seed
php artisan serve
```

## Comptes seedes (mot de passe: `Password@123`)
- RH: `rh@larache.ma`
- Naib RH: `naib.rh@larache.ma`
- President: `president@larache.ma`
- Occasionnel: `occasionnel@larache.ma`

## Regles metier implementees
- Validation age: 18-60.
- 2 jours non travailles / semaine (samedi + dimanche) exclus du calcul.
- Controle apres 3 mois avec alerte pause obligatoire 10-15 jours (sans rejet auto).
- Calcul salaire:
  - avant `2026-04-01`: `93.00 DH/jour`
  - a partir de `2026-04-01`: `97.44 DH/jour`
  - RCAR: `6%`
- Workflow:
  1. Occasionnel depose.
  2. RH traite.
  3. President decide.
  4. RH finalise.

## Endpoints principaux
- `POST /api/auth/register`
- `POST /api/auth/verify-code`
- `POST /api/auth/login`
- `GET /api/dashboard/summary`
- `POST /api/applications`
- `POST /api/applications/{id}/upload-document` (PDF only)
- `POST /api/applications/{id}/submit`
- `GET /api/rh/queue`
- `POST /api/rh/applications/{id}/send-to-president`
- `POST /api/president/applications/{id}/decide`
- `POST /api/rh/applications/{id}/finalize`
- `POST /api/documents/{application}/generate`
- `GET /api/documents/{document}/download`

## Documents PDF
Generation auto:
- `dossier_summary` a l'inscription
- `engagement`, `prise_service`, `decision`
- `affectation` si affectation definie

Fichiers stockes sur disque local: `storage/app/documents`.
