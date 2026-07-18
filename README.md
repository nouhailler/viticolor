# Viticolor

PWA mobile de sommellerie du vignoble français — React + Vite + TypeScript, PWA
offline-first, sans backend (données JSON embarquées, persistance `localStorage`).

## Contenu du dépôt

| Dossier / fichier | Rôle |
| --- | --- |
| **`app/`** | L'application (code, données, scripts, PWA). Voir [`app/README.md`](app/README.md). |
| **`design_handoff_viticolor/`** | Dossier de handoff de référence (prototype HTML, captures, README de design) à partir duquel l'app a été recréée. |
| **`CONTEXT.md`** | État du projet pour **reprendre le travail** (décisions, conventions, catalogue, TODO). |
| **`CHANGELOG.md`** | Journal chronologique des changements. |

## Démarrage rapide

```bash
cd app
npm install
npm run dev      # développement (http://localhost:5173)
npm run build    # build de production → app/dist
npm test         # rendu SSR de tous les écrans
```

## État actuel (18 juillet 2026)

- **App complète** : 20 écrans (accueil, régions, cépages, millésimes, scanner caméra,
  cave, dégustation, accords, arômes, histoire, cotes, routes, glossaire, actus,
  vendanges, collection, quiz, recherche, **Bouteilles**), PWA installable, offline-first.
- **Catalogue de vins** : **162 vins · 119 producteurs**, enrichi via un pipeline
  d'ingestion (`app/scripts/ingest-wines.mjs`).

| Région | Vins |
| --- | --- |
| Bourgogne | 35 |
| Alsace | 34 |
| Champagne | 33 |
| Beaujolais | 30 |
| Savoie & Bugey | 29 |
| Vallée du Rhône | 1 |

Couleurs : 62 blancs · 57 rouges · 40 effervescents · 3 rosés.

## Prochaines étapes

- Continuer d'enrichir le catalogue (régions restantes : Bordeaux, Rhône, Loire,
  Provence, Languedoc, Jura, Sud-Ouest) + ~7 champagnes manquants du dernier lot.
- Brancher le **scanner** sur le catalogue (l'OCR renverra un vrai vin).
- Exposer le catalogue dans la **recherche globale**.

Détails et conventions dans [`CONTEXT.md`](CONTEXT.md).
