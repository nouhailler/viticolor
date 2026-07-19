# CONTEXT — reprise de travail Viticolor

_Dernière mise à jour : 19 juillet 2026._

Ce fichier sert à **reprendre le projet** rapidement (conventions, décisions, état).

## 1. Ce qu'est le projet

Viticolor est une PWA mobile de sommellerie du vignoble français, recréée à partir du
dossier de handoff `design_handoff_viticolor/` (prototype HTML haute-fidélité). L'app
vit dans `app/` : **React 18 + Vite 5 + TypeScript strict**, aucune dépendance runtime
au-delà de React. Données JSON embarquées, persistance `localStorage` (préfixe
`viticolor_`), PWA offline-first (vite-plugin-pwa), déployable sur Netlify.

- Store maison : `app/src/store.ts` (observable + `useSyncExternalStore`, snapshots
  mémoïsées sur l'identité de l'état).
- Écrans : `app/src/screens/` (20 écrans). Routeur dans `app/src/App.tsx`.
- Données : `app/src/data/*.json` + `index.ts` typé. Types dans `app/src/types.ts`.
- Tests : `npm test` (rendu SSR de tous les écrans via `app/scripts/smoke.tsx`).
- Captures README : `npm run screenshots` (Playwright ; nécessite `npm run preview`
  lancé au préalable) → `docs/screenshots/*.png`, référencées dans `README.md`.
- Le nombre de régions affiché est **dynamique** (`REGIONS.length`) dans l'écran Régions
  et le menu ; textes prose (onboarding, manifest PWA) passés à « 14 régions ».

## 2. Catalogue de vins (travail en cours)

Fichier : `app/src/data/wines.json` (typé `Wine`, exporté `WINES`). C'est un
**référentiel** distinct de la cave perso (`cave.json`). Écran dédié :
`app/src/screens/Bouteilles.tsx` (liste + recherche domaine/appellation/cépage +
filtres couleur/région + fiche détail), accessible via le menu hamburger.

**État au 19/07/2026 : 391 vins · 202 producteurs.**

| Région (regionId) | Vins |
| --- | --- |
| Savoie & Bugey (`savoie`) | 52 |
| Bourgogne (`bourgogne`) | 35 |
| Vallée du Rhône (`rhone`) | 35 |
| Alsace (`alsace`) | 34 |
| Champagne (`champagne`) | 33 |
| Corse (`corse`) | 32 |
| Loire (`loire`) | 31 |
| Jura (`jura`) | 31 |
| Beaujolais (`beaujolais`) | 30 |
| Languedoc-Roussillon (`languedoc`) | 26 |
| Provence (`provence`) | 26 |
| Lorraine (`lorraine`) | 26 |

Couleurs : 147 blancs · 141 rouges · 53 effervescents · 32 rosés · 18 liquoreux.
(Un « Crémant de Savoie » erroné attribué au Caveau de Buxy — coopérative de Bourgogne —
a été retiré.)

Note : **Roussillon → `languedoc`** (région combinée). Le script d'ingestion nettoie
un parenthétique de région (« Provence (mais proche du Languedoc) » → provence).
3 fiches de la source retirées (producteur ≠ appellation, pas de substitution) :
Domaine de l'Octavin (Côtes du Roussillon + Rivesaltes ; l'Octavin est un domaine du
Jura) et Château de Pez en Minervois (c'est un Saint-Estèphe / Bordeaux).

**Ajout d'une région = 3 fichiers** (leçon du lot Corse) : `regions.json` (fiche
région) **et** `atlas.json` (entrée avec `pos`/`vil`/`dom`… sinon la vue carte des
Régions plante : `ATLAS[r.id].pos`) **et** le mapping `REGION_BY_NAME` du script
d'ingestion. Corse ajoutée comme 13ᵉ région (id `corse`, tint `#3d7d6e`).

## 3. Pipeline d'ingestion

Outil : **`app/scripts/ingest-wines.mjs`** — `node scripts/ingest-wines.mjs <lot.txt>`.
Il parse le gabarit texte étiqueté, normalise, déduplique (par id), canonicalise les
producteurs, met à jour `wines.json` et imprime un rapport.

Gabarit d'un vin (un bloc, séparés par ligne vide ou `---`) :

```
Domaine : …
Cuvée : …            (facultatif)
Appellation : …
Région : …
Couleur : …
Millésime : …        (ou « non millésimé »)
Cépages : …
Degré : … Prix moyen : … € Température : … Garde : … Notes : … Accords : …
```

Le script tolère aussi les **exports scrapés** : octets UTF-8 échappés (`\C3\A9`…),
tags `[estimé]`/`[source]`, `non indiqué`, préfixe `AOP`, millésimes multiples.

**id** = `slug(domaine + (cuvée | appellation) + millésime)` — l'appellation
désambiguïse quand la cuvée est vide.

### Décisions/conventions actées avec l'utilisateur

- **Format d'apport** : gabarit texte étiqueté, par petits paquets dans le chat
  (je les écris dans `app/data-batches/<lot>.txt` puis j'ingère).
- **Champs manquants** : je **comble intelligemment** (température selon couleur,
  couleur déduite du cépage/dénomination) ET je liste ce qui est inféré (`comble[]`).
- **Couleur manquante** : déduite de l'appellation/cépage quand c'est évident
  (Gamay → rouge, Chardonnay → blanc, Crémant → effervescent…).
- **Hors-région** : on ingère quand même (ex. Bourgogne/Pouilly-Fuissé sous producteur
  beaujolais), avec signalement.
- **Canonicalisation des producteurs** :
  - « X » et « Domaine X » → unifiés vers **« Domaine X »** (pas les Château/Maison).
  - Préfixe **« Champagne »** retiré (redondant) : `Champagne Ruinart` → `Ruinart`.
  - Cerdon « Tour Rose » → forme retenue **« Caveau de la Tour Rose »**.
  - Corrections ponctuelles déjà faites : Bott-Gey→Bott-Geyl, Bereche→Bérêche & Fils,
    Comtes Lafon → Domaine des Comtes Lafon, 6 producteurs alsaciens douteux remplacés
    par la référence réelle du cru, Trimbach Clos Sainte Hune / Léon Beyer Comtes
    d'Eguisheim / Musigny Blanc de Vogüé reclassés (GC → appellation réelle).
- Scripts utilitaires : `scripts/canonicalize.mjs` (unif. « Domaine »),
  `scripts/ingest-wines.mjs` (ingestion). Les lots bruts vont dans `app/data-batches/`
  (non commités, `*.txt` gitignorés).

## 4. TODO / prochaines étapes

- [ ] Charger les régions restantes : Bordeaux, Sud-Ouest
  (+ ~7 champagnes manquants du dernier lot, paste tronqué).
      Corse (32, `corse-1.txt`), Jura (31, `jura-1.txt`), Languedoc-Roussillon
      (28, `languedoc-1.txt`), Lorraine (26, `lorraine-1.txt`, 14ᵉ région), Loire
      (31, `loire-1.txt`), Provence (24, `provence-1.txt`), Rhône (34,
      `rhone-1.txt`) et Savoie #2 (24, `savoie-2.txt`) faits le 19/07/2026.
- [ ] Brancher le **scanner** (`app/src/lib/ocr.ts`, stub) sur `WINES` : renvoyer un
  vrai vin du catalogue.
- [ ] Exposer `WINES` dans la **recherche globale** (`app/src/screens/Search.tsx`).
- [ ] (option) formatage FR des prix décimaux dans la fiche Bouteilles.

## 5. Vérifier avant de committer

```bash
cd app && npm run typecheck && npm run build && npm test
```
