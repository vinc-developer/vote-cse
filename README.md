# 🗳️ Vote CSE — Application de vote anonyme

Application web de vote anonyme pour le Comité Social et Économique (CSE).

## Architecture

- **Frontend** : Next.js 14+ avec export statique
- **Backend** : Firebase Realtime Database + Firebase Auth
- **Hébergement** : GitHub Pages
- **Styling** : Bootstrap 5 + thème CSE personnalisé (#fbbe00)

## Fonctionnalités

- ✅ **Authentification admin** par email/mot de passe (Firebase Auth)
- ✅ **Création de sessions** avec code court (ex: `CSE-A3K9`)
- ✅ **Vote anonyme** — aucun identifiant utilisateur stocké
- ✅ **Anti double-vote** — localStorage + compteur avec auto-fermeture
- ✅ **Résultats temps réel** — réservés aux administrateurs
- ✅ **Suppression de sessions** par l'admin
- ✅ **Déploiement automatique** via GitHub Actions

## Pages

| URL | Description |
|-----|-------------|
| `/` | Saisie du code session pour voter |
| `/session/?id=xxx` | Page de vote |
| `/results/?id=xxx` | Résultats (admin uniquement) |
| `/admin/` | Administration (login, créer/gérer sessions) |

## Installation locale

```bash
npm install
cp .env.example .env.local
# Remplir les valeurs Firebase dans .env.local
npm run dev
```

## Build production

```bash
npm run build
# Le dossier out/ contient le site statique
```

## Déploiement GitHub Pages

1. Créer un repo GitHub nommé `vote-cse`
2. Configurer les 7 secrets Firebase dans Settings → Secrets → Actions
3. Activer Pages en mode "GitHub Actions" dans Settings → Pages
4. Push sur `main` → déploiement automatique

## Structure

```
app/
├── layout.tsx          # Layout principal
├── page.tsx            # Accueil (saisie code session)
├── session/page.tsx    # Page de vote
├── results/page.tsx    # Résultats (admin only)
└── admin/page.tsx      # Administration
lib/
├── firebase.ts         # Init Firebase
├── auth.ts             # Login/logout admin
├── crypto.ts           # Génération codes session
├── types.ts            # Interfaces TypeScript
├── db.ts               # CRUD Firebase
└── hooks.ts            # Hooks React temps réel
```
