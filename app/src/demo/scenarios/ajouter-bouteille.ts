import type { DemoScenario } from '../types';

/**
 * Parcours : accueil → Ma cave → choix d'un vin du catalogue → fiche de la
 * bouteille ajoutée. La cave de départ est un seed isolé (2 bouteilles) :
 * la vraie cave de l'utilisateur n'est ni affichée ni modifiée.
 */
export const ajouterBouteille: DemoScenario = {
  id: 'ajouter-bouteille',
  title: 'Ajouter une bouteille',
  description: 'De l’accueil à la cave : recherche d’un vin du catalogue et ajout en un geste.',
  seed: {
    caveFilter: 'tous',
    caveSel: null,
    caveItems: [
      {
        id: 'demo-b1',
        name: 'Meursault « Charmes » 2020',
        meta: 'Bourgogne · blanc',
        apogee: '2025–2032',
        from: 2025,
        to: 2032,
        prix: 85,
        delta: 8,
        color: 'blanc',
        tint: '#c9a44d',
        qty: 2,
      },
      {
        id: 'demo-b2',
        name: 'Cornas « Reynard » 2019',
        meta: 'Vallée du Rhône · rouge',
        apogee: '2026–2038',
        from: 2026,
        to: 2038,
        prix: 68,
        delta: 11,
        color: 'rouge',
        tint: '#6e1f2e',
        qty: 3,
      },
    ],
  },
  steps: [
    {
      kind: 'narrate',
      text: 'Bienvenue dans Viticolor ! Voyons comment ajouter une bouteille à votre cave.',
    },
    { kind: 'click', target: 'nav-cave', comment: 'onglet Cave du menu du bas' },
    {
      kind: 'highlight',
      target: 'cave-valorisation',
      durationMs: 1200,
    },
    {
      kind: 'narrate',
      text: 'Votre cave est valorisée en continu, avec les pics de maturité à surveiller.',
      target: 'cave-valorisation',
    },
    { kind: 'click', target: 'cave-ajouter' },
    {
      kind: 'narrate',
      text: 'On pioche dans le catalogue — cherchons un Morgon du Beaujolais.',
    },
    { kind: 'type', target: 'cave-picker-recherche', text: 'morgon' },
    {
      kind: 'narrate',
      text: 'Premier résultat : il ne reste qu’à l’ajouter.',
      target: 'cave-picker-item-0',
      durationMs: 2200,
    },
    { kind: 'click', target: 'cave-picker-add-0' },
    {
      kind: 'narrate',
      text: 'La bouteille rejoint la cave et sa fiche s’ouvre : prix modifiable, fenêtre de garde, retrait possible.',
      target: 'cave-fiche',
    },
    { kind: 'wait', ms: 600 },
    {
      kind: 'narrate',
      text: 'C’est terminé ! Échap quitte la démo à tout moment — votre vraie cave n’a pas été modifiée.',
    },
  ],
};
