# Gestion des dossier des agents occasionnels - Commune de Larache

Application web complete:
- Frontend: React + React Router + Axios + Framer Motion + i18n (FR/AR RTL)
- Backend: Laravel API + Sanctum + DomPDF
- Database: MySQL

## Structure
- `backend/`: API Laravel
- `frontend/`: Application React

## Lancer le backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Lancer le frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## URL par defaut
- API: `http://localhost:8000/api`
- Frontend: `http://localhost:5173`

## Fonctionnalites livrees
- Inscription publique avec verification par code.
- Authentification Sanctum (token).
- Roles: guest, occasionnel, rh, naib_rh, president.
- Depot de dossier (PDF only) + validation serveur.
- Workflow RH -> President -> finalisation RH.
- Calcul salaire automatique + RCAR.
- Gestion periodes travail + alertes conformite.
- Generation PDF administrative.
- Notifications in-app + email (mailer `log` par defaut).
- Dashboards distincts (Occasionnel, RH, President).
- Loader plein ecran anime entre transitions.
- Theme UI marocain (beige, bleu, or, motifs zellij), responsive.
