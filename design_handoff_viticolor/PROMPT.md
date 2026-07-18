# Prompt pour Claude Code

Colle ce prompt dans Claude Code, à la racine du dossier `design_handoff_viticolor` (ou en le référençant) :

---

Implémente « Viticolor », une PWA mobile de sommellerie du vignoble français, à partir du dossier de handoff ci-joint.

Contexte :
- `README.md` décrit exhaustivement les 18 écrans, les design tokens, les interactions et l'état.
- `Viticolor.dc.html` est le prototype HTML haute-fidélité de référence : recrée son apparence au pixel près, mais NE copie pas son code — c'est un prototype. Extrais toutes les données embarquées (régions, cépages, millésimes, glossaire, articles, routes, cotes, arômes, actus, vendanges, collection) vers des fichiers JSON.
- `screenshots/` contient 19 captures de référence (01-onboarding → 19-mode-demo).

Exigences :
1. Stack : React + Vite (ou vanilla JS si tu juges plus léger), TypeScript bienvenu. Aucun backend : données en JSON embarqué, persistance localStorage (préfixe `viticolor_`).
2. PWA complète : `manifest.json` (nom Viticolor, thème `#3a1219`, accent `#d4b06a`), icônes maskable, service worker offline-first, installable sur Android, déployable sur Netlify (`netlify.toml`).
3. Respecte strictement les design tokens du README (bordeaux profond `#3a1219`/`#4a1a23`, or `#d4b06a`, Cormorant Garamond + Karla, radius 2px, hit targets ≥ 44px).
4. Navigation : bottom nav 5 onglets + menu hamburger 18 entrées + bouton retour contextuel, comme sur les captures.
5. Scanner : intègre la caméra réelle via `getUserMedia` avec l'UI de visée du prototype ; branche un point d'extension pour l'OCR d'étiquette (stub qui renvoie la fiche de démo pour l'instant).
6. Onboarding 4 slides au premier lancement (persisté) et mode démo (bandeau d'astuce contextuel par écran, toggle dans le menu, persisté).
7. Toutes les fonctionnalités persistantes du prototype : favoris, cave (quantités + valorisation), carnet de dégustation (6 critères, /100, étoiles, photo), collection cochable.
8. Qualité : composants réutilisables, données typées, Lighthouse PWA ≥ 90, aucune dépendance lourde inutile.

Livrable : projet prêt à `npm run build` + déploiement Netlify.
