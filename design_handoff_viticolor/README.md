# Handoff : Viticolor — application sommelier du vignoble français (PWA Android)

## Overview
Viticolor est une application mobile (cible : PWA Android, déployable sur Netlify) de sommellerie dédiée au vignoble français. Elle couvre : exploration des 12 régions viticoles (carte interactive, fiches terroir, fiches techniques pro), 13 fiches cépages, historique des millésimes 2015–2023 avec graphiques comparatifs, scanner d'étiquettes avec fiche bouteille complète, cave personnelle valorisée (cotes, apogée), carnet de dégustation détaillé, accords mets-vins, quiz sommelier, actualités, suivi des vendanges, objectifs de collection, lexique des arômes (9 familles), glossaire (~170 termes, base 500+ prévue), 4 routes des vins, cote des vins avec graphiques 5/10 ans, articles histoire & culture, onboarding 4 slides et mode démo contextuel.

## About the Design Files
Les fichiers de ce dossier sont des **références de design créées en HTML** — des prototypes montrant l'apparence et le comportement voulus, PAS du code de production à copier tel quel. La tâche est de **recréer ces designs dans l'environnement du projet cible** (React, Vue, Svelte, ou vanilla JS + service worker pour une PWA légère) en utilisant ses patterns et bibliothèques établis. Si aucun environnement n'existe encore, choisir le framework le plus adapté (recommandation : React + Vite, ou vanilla JS, avec manifest PWA + service worker pour l'offline, déployé sur Netlify).

`Viticolor.dc.html` est le prototype maître : tout le contenu éditorial (textes, données régions/cépages/millésimes, glossaire, articles) y est embarqué en JavaScript et doit être extrait vers des fichiers de données (JSON) dans l'implémentation réelle.

## Fidelity
**High-fidelity (hifi)** : couleurs, typographies, espacements, contenus et interactions sont finaux. Recréer l'UI au pixel près avec les captures d'écran (`screenshots/`) comme référence visuelle.

## Cadre général
- Mobile portrait 428×908 (le prototype est présenté dans un cadre Android ; l'app réelle est plein écran).
- Structure : header fixe (menu hamburger + logo « Viticolor » + recherche) · zone de contenu défilante · bottom nav 5 onglets (Accueil, Régions, Scanner, Cave, Savoir).
- Menu hamburger (drawer gauche, overlay sombre rgba(20,6,9,.62)) : Accueil, Régions & carte, Cépages, Historique des millésimes, Scanner une étiquette, Ma cave, Carnet de dégustation, Accords mets & vins, Actualités, Glossaire, Lexique des arômes, Route des vins, Cote des vins, Histoire & culture, Vendanges, Collection, Savoir & quiz, Recherche + toggle « Mode démo » en bas.

## Design Tokens
Couleurs (thème « bordeaux profond ») :
- Fond app : `#3a1219` · fond page derrière le device : radial-gradient `#4a1b24 → #260b10`
- Cartes / surfaces : `#4a1a23` (bord `#56222b`), surface creuse `#3a1219`, variante liste `#421620`
- Accent or : `#d4b06a` (boutons pleins : texte `#2b1014`) · or clair `#e8d5ae` · bord or discret `#8a6f43`
- Texte principal : `#f2e7d3` · secondaire `#dfc9b2` · tertiaire `#c2a291` · muet `#a98a7d`
- Sémantique : hausse/positif `#7fa86b`, baisse/négatif `#c96b5a`, rouge brand dégradés héros `#6e2230 → #93374a → #a03a50`
- Liens : `a { color:#d4b06a }`, hover `#f2e7d3`

Typographie :
- Titres / display : **Cormorant Garamond** (Google Fonts), 600–700 ; titres d'écran 28px, héros 34px, cartes 17–22px, étiquettes uppercase 13px letterspacing 2.5px
- Corps / UI : **Karla** (Google Fonts) ; corps 13–14px, méta 10.5–12px (uppercase letterspacing 1.5px pour les micro-labels)

Formes : radius 2px (cartes, boutons), 3px (panneaux), 999px (puces/filtres), 50% (pastilles) — esthétique volontairement peu arrondie.
Espacement : padding écran 20px ; gaps 8/10/12/14/16/18/22px ; hit targets ≥ 44px (items de menu 48px).

## Screens / Views (19 captures dans screenshots/)
1. **Onboarding** (`01`) — overlay plein écran au premier lancement (persisté `onboard`), 4 slides (icône, titre or 32px, texte centré), points de progression, boutons « Passer » (contour or) / « Suivant » puis « Commencer » (plein or).
2. **Accueil / Mode découverte** (`02`, `19`) — héros typographique, faux champ de recherche, « Découverte du jour » avec rotation quotidienne (index = jour mod n) : carte région dégradé rouge (tap → fiche région), carte cépage (tap → Cépages), carte bouteille, carte domaine, encart anecdote (bord or). Le `19` montre le **bandeau mode démo** : bande or pleine sous le header, 💡 + astuce contextuelle par écran + croix de fermeture (par écran) ; toggle global dans le menu, persisté `demo`.
3. **Régions & carte** (`03`) — onglets Carte / Régions / Cépages / Millésimes ; carte de France avec marqueurs positionnés en %, zoom régional, domaines Bio/HVE.
4. **Cépages** (`04`) — 13 fiches : origine, histoire, couleur, arômes, jauges Acidité/Sucre/Tanin, potentiel de garde, régions.
5. **Historique des millésimes** (`05`) — graphiques barres comparatifs Note/Météo/Garde 2015–2023, détail au tap.
6. **Scanner** (`06`) — cadre visé avec ligne de scan animée (`@keyframes scanline`) ; après scan : fiche bouteille (photo drag-drop `image-slot`, domaine, appellation, millésime, grille 2 col : cépages, degré, prix moyen, température de service, potentiel de garde, région ; notes ; accords en puces contour or ; boutons « Ajouter à ma cave » / « Nouveau scan »).
7. **Ma cave** (`07`) — bouteilles avec quantités, badges d'apogée (pulse or), valorisation (cote × quantité, tendance 12 mois).
8. **Carnet de dégustation** (`08`) — formulaire : photo, vin, prix, où acheté, 6 critères (robe, nez, bouche, longueur, équilibre, plaisir) notés par 5 pastilles cliquables, commentaire, slider /100 (accent or), 5 étoiles ; fiches enregistrées avec étoiles ★☆, ligne d'achat et chips récap des critères. Persisté `notes`.
9. **Accords mets & vins** (`09`) — sélection plat ↔ vin.
10. **Actualités** (`10`) — filtres puces (Tout, Nouveaux millésimes, Salons, Récompenses, Concours, Réglementation), cartes datées avec label coloré par catégorie.
11. **Glossaire** (`11`) — recherche insensible aux accents, index A–Z, fiches terme/définition ; données dans `glossaire-data.js` (~170 termes ; base 500+ à charger en prod).
12. **Lexique des arômes** (`12`) — 9 familles (puce couleur dédiée), fiche famille (origine primaire/secondaire/tertiaire, description, astuce), 4–6 arômes avec « où les trouver ».
13. **Route des vins** (`13`) — 4 itinéraires (Alsace, Bourgogne, Champagne, Loire) : bandeau km/durée/étapes, frise verticale numérotée (pastille or + trait), halte recommandée « ◆ ».
14. **Cote des vins** (`14`) — liste 8 vins (prix, évo annuelle colorée), fiche estimation (cote, évo 5/10 ans), graphique barres commutable 5/10 ans (dernière barre en `#f2e7d3`).
15. **Histoire & culture** (`15`) — 7 articles accordéon (époque uppercase or, durée de lecture, chapô ; 3 paragraphes + anecdote en encart bord or gauche).
16. **Vendanges** (`16`) — frise août–octobre, 12 régions avec barre de fenêtre de récolte positionnée en % (or = en cours, brun = terminées, rouge = à venir), météo, fiche détail au tap.
17. **Collection** (`17`) — 4 objectifs (Grands Crus de Bourgogne 33, Premiers Crus obj. 635, AOC obj. 363, Cépages obj. 210) : barre de progression, liste dépliable cochable (pastille ronde → check or), persisté `coll`.
18. **Savoir & quiz** (`18`) — quiz sommelier à niveaux, score final.

## Interactions & Behavior
- Navigation par état d'écran unique (`screen`) + pile de retour (bouton « ← retour » quand hors écrans racine).
- Persistance localStorage préfixée `viticolor_` : favoris, cave, notes de dégustation, collection cochée, onboarding vu, mode démo.
- Mode démo : dictionnaire écran → astuce ; bandeau visible si activé ET astuce non fermée pour cet écran ET onboarding terminé.
- Animations : ligne de scan (keyframes), pulse des badges d'apogée ; transitions discrètes, pas d'animations décoratives.
- Recherche : normalisation NFD sans accents, sur nom + description.
- Découverte du jour : `Math.floor(Date.now()/86400000) % longueur` par liste.

## State Management
État global : écran courant + contexte (région sélectionnée, onglet régions), requête de recherche, filtres (cave, actus, cote période 5/10, sélections région/route/famille/vin), formulaires du carnet, données persistées (cave, notes, favoris, collection, onboarding, démo). En prod : un store léger (Zustand/Pinia ou context) + wrapper localStorage suffit ; pas de backend requis pour la v1 (données embarquées en JSON).

## À prévoir côté implémentation PWA (hors design)
- `manifest.json` + icônes + service worker (offline-first, données embarquées).
- Scanner : caméra réelle (getUserMedia) + OCR/reconnaissance d'étiquette (le prototype simule le scan).
- Données réelles à brancher : cotes de marché, actualités (flux), cadastre/GPS des cartes régionales, glossaire 500+, référentiels complets (635 premiers crus, 363 AOC).

## Assets
- Google Fonts : Cormorant Garamond, Karla.
- Aucune image bitmap : cartes et pictos dessinés en CSS/positionnement ; emplacements photo = composant drag-and-drop (`image-slot.js`) à remplacer par upload/caméra en prod.

## Files
- `Viticolor.dc.html` — prototype maître (template + logique + toutes les données embarquées).
- `glossaire-data.js` — données du glossaire (~170 termes).
- `image-slot.js`, `android-frame.jsx`, `support.js` — runtime du prototype uniquement (ne pas porter en prod).
- `Viticolor crème.dc.html` — ancienne variante claire conservée (référence historique, non maintenue) — non incluse ici.
- `screenshots/` — 19 captures d'écran de référence (01–19, voir liste ci-dessus).
- `PROMPT.md` — prompt prêt à coller dans Claude Code.
