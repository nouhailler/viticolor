# Changelog — Viticolor

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/).

## [Non publié]

### 2026-07-18 — Implémentation initiale + catalogue de vins

#### App (implémentation depuis le handoff)
- Scaffold **React 18 + Vite 5 + TypeScript strict**, PWA offline-first
  (vite-plugin-pwa : manifest, service worker Workbox, icônes maskable).
- Extraction de **toutes les données embarquées** du prototype vers `app/src/data/*.json`
  (régions, atlas, terroir, cépages, millésimes, cave, accords, quiz, arômes, histoire,
  cotes, routes, actus, vendanges, collection, glossaire 178 termes, onboarding, etc.).
- **19 écrans** recréés au plus près du prototype + coquille (header, bandeau démo,
  drawer 18 entrées, bottom nav 5 onglets), store maison + persistance `localStorage`.
- Scanner **caméra réelle** (`getUserMedia`) avec point d'extension OCR
  (`app/src/lib/ocr.ts`, stub renvoyant la fiche de démo).
- Onboarding 4 slides + mode démo contextuel, favoris, cave valorisée, carnet de
  dégustation (6 critères, /100, étoiles, photo), collection cochable.
- Qualité : typecheck strict, build OK, test SSR de tous les écrans (`npm test`).
- Déploiement Netlify prêt (`app/netlify.toml`).

#### Catalogue de vins (nouveau)
- Nouveau **référentiel `WINES`** (`app/src/data/wines.json`, type `Wine`) + écran
  **Bouteilles** (`app/src/screens/Bouteilles.tsx`) : liste, recherche, filtres
  couleur/région, fiche détail.
- **Pipeline d'ingestion** `app/scripts/ingest-wines.mjs` (parse gabarit, décodage des
  exports scrapés, normalisation, déduplication, déduction de couleur, comblage
  intelligent, rapport) + `scripts/canonicalize.mjs`.
- Lots ingérés :
  - **Alsace** : 34 vins (6 producteurs douteux corrigés vers la référence réelle du
    cru ; Trimbach Clos Sainte Hune & Léon Beyer Comtes d'Eguisheim reclassés en Alsace).
  - **Beaujolais** : 30 vins.
  - **Bourgogne** : 35 vins (Comtes Lafon unifié ; Musigny Blanc de Vogüé reclassé en
    Bourgogne).
  - **Savoie & Bugey** : 29 vins (mapping « Bugey » → `savoie`).
  - **Champagne** : 33 vins (préfixe « Champagne » retiré → producteurs unifiés ;
    rosés pétillants classés `effervescent` ; Bérêche & Fils corrigé).
- **Total : 162 vins · 119 producteurs.**
- Convention de nommage des producteurs canonicalisée (« Domaine X », préfixe
  « Champagne » retiré, Cerdon = « Caveau de la Tour Rose »).

_Reste à faire : régions Bordeaux/Loire/Rhône/Provence/Languedoc/Jura/Sud-Ouest,
~7 champagnes manquants, branchement du scanner sur le catalogue. Voir `CONTEXT.md`._
