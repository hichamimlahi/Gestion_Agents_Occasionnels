# Gestion des dossier des agents occasionnels - Frontend React

## Stack
- React + Vite
- React Router
- Axios
- Framer Motion
- i18next (FR + AR RTL)

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

Configurer `VITE_API_BASE_URL` dans `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Pages
- Accueil public (hero, stats, FAQ, steps, infos admin)
- Auth: inscription, verification code, connexion
- Depot de demande occasionnel + uploads PDF
- Dashboard occasionnel
- Dashboard RH / Naib RH
- Dashboard President

## UI
- Theme marocain administratif (beige, bleu, or)
- Motifs zellij fond global
- Loader fullscreen anime 2s sur transitions de page
- Responsive desktop/mobile
