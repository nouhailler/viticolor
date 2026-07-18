# Viticolor

PWA mobile de sommellerie du vignoble français — recréée à partir du dossier de
handoff (`../design_handoff_viticolor`). React + Vite + TypeScript, aucun backend :
toutes les données sont embarquées en JSON, la persistance passe par `localStorage`
(préfixe `viticolor_`), et l'application est installable et fonctionne hors ligne.

## Démarrer

```bash
npm install
npm run dev        # serveur de dev (http://localhost:5173)
npm run build      # typecheck + build de production dans dist/
npm run preview    # sert le build de production
npm run typecheck  # vérification TypeScript seule
```

> La caméra du scanner nécessite un contexte sécurisé (HTTPS ou `localhost`).

## Stack & choix

- **React 18 + Vite 5 + TypeScript strict.** Aucune dépendance runtime au-delà de
  React/React-DOM.
- **Store maison** (`src/store.ts`) : un petit store observable branché sur
  `useSyncExternalStore`, avec sélecteurs typés et snapshots mémoïsées sur
  l'identité de l'état. Le wrapper `localStorage` persiste favoris, cave, carnet,
  collection, onboarding et mode démo.
- **PWA** via `vite-plugin-pwa` (Workbox) : service worker *offline-first* qui
  précache le shell + toutes les données, manifest complet, icônes maskable.

## Structure

```
src/
  data/            # 26 fichiers JSON extraits du prototype + index.ts typé
  types.ts         # types du modèle de données
  store.ts         # état global + persistance localStorage + actions
  theme.css        # design tokens (bordeaux profond, or, typographies, formes)
  lib/             # helpers (cave, millésimes, fiche technique, ocr, recherche)
  components/       # Shell (header, bandeau démo, drawer, bottom nav), UI, PhotoSlot
  screens/          # 19 écrans (Home, Regions, RegionFiche, Carte, Scanner, …)
  App.tsx           # routeur d'écran + coquille
```

### Données (JSON embarqué)

Tout le contenu éditorial du prototype a été extrait vers `src/data/*.json` :
`regions`, `atlas`, `terroir`, `cepages` (13 fiches), `cepagesLexique`, `millesimes`,
`cave`, `accords`, `quiz`, `aromes` (9 familles), `histoire` (7 articles), `cotesVins`,
`routes` (4 itinéraires), `actus`, `vendanges`, `collection`, `glossaire` (178 termes),
`onboarding`, `demoTips`, `decouverte*`, `scanDemo`, `seedNotes`. `index.ts` les
réexporte typés.

## Design tokens

Définis en variables CSS dans `src/theme.css`, conformément au handoff :

| Rôle | Valeur |
| --- | --- |
| Fond app | `#3a1219` |
| Cartes / surfaces | `#4a1a23` (bord `#56222b`) |
| Accent or | `#d4b06a` · or clair `#e8d5ae` · bord or `#8a6f43` |
| Texte | `#f2e7d3` / `#dfc9b2` / `#c2a291` / `#a98a7d` |
| Sémantique | hausse `#7fa86b` · baisse `#c96b5a` |
| Titres | Cormorant Garamond · Corps : Karla |
| Formes | radius 2px (cartes) · 999px (puces) · hit targets ≥ 44px |

## Scanner & point d'extension OCR

L'écran Scanner ouvre la **caméra réelle** via `getUserMedia` (caméra arrière si
disponible ; repli sur le fond rayé du prototype si l'accès est refusé) avec l'UI
de visée (cadre, coins or, ligne de scan animée).

La reconnaissance d'étiquette est isolée dans **`src/lib/ocr.ts`** :

```ts
export async function recognizeLabel(frameDataUrl?: string): Promise<ScanDemo>
```

C'est le **point d'extension**. Actuellement un *stub* qui renvoie la fiche de
démonstration (Domaine Jamet, Côte-Rôtie 2020) après la capture d'une trame vidéo.
Pour brancher un vrai OCR, remplacez le corps de cette fonction par un appel à votre
moteur (Tesseract.js local, ou API vision côté serveur) — la trame capturée est
fournie en `frameDataUrl`.

## Déploiement Netlify

`netlify.toml` est prêt : base `app`, build `npm run build`, publication `dist`,
fallback SPA, et en-têtes de cache (SW non caché, assets hashés immuables).

- Connecter le dépôt à Netlify (le fichier suffit), **ou**
- `npx netlify deploy --prod` depuis `app/` après un `npm run build`.

## Vérification

- `npm run build` : typecheck strict + build sans erreur.
- Test de rendu SSR (`scripts/smoke.tsx`) : les 19 écrans (26 cas d'état) se rendent
  sans exception.
- Manifest, service worker et icônes maskable présents dans `dist/`.

## Fonctionnalités persistées (`viticolor_*`)

Favoris régions · quantités de cave & valorisation · carnet de dégustation (6 critères,
note /100, étoiles, photo) · collection cochable · onboarding vu · mode démo. Les
données de démo (cave, notes) servent d'amorçage au premier lancement.
