import type { DemoScenario } from '../types';
import { CAVE_DEMO } from './cave-demo';

/**
 * Parcours : accueil → Scanner (viseur) → résultat reconnu → ajout à la cave
 * → fiche complète du catalogue. Le seed `scanDemoText` remplace caméra + OCR
 * (pas d'invite de permission) ; le rapprochement catalogue et les écrans de
 * résultat sont le vrai code de l'application.
 */
export const scannerEtiquette: DemoScenario = {
  id: 'scanner-etiquette',
  title: 'Scanner une étiquette',
  description: 'Du viseur caméra à la fiche du vin reconnu, puis ajout à la cave.',
  seed: {
    caveFilter: 'tous',
    caveSel: null,
    caveItems: CAVE_DEMO,
    scanDemoText: 'Domaine Jean Foillard Morgon Côte du Py 2023 vin de France',
  },
  steps: [
    {
      kind: 'narrate',
      text: 'Le scanner lit l’étiquette d’une bouteille et la reconnaît parmi les 449 vins du catalogue.',
    },
    { kind: 'click', target: 'nav-scanner', comment: 'onglet Scanner du menu du bas' },
    {
      kind: 'narrate',
      text: 'Visez l’étiquette dans le cadre… Pour cette démo, la lecture est simulée — pas besoin de caméra.',
    },
    { kind: 'click', target: 'scan-bouton' },
    { kind: 'wait', ms: 900, comment: 'laisse finir « Analyse… »' },
    {
      kind: 'highlight',
      target: 'scan-resultat',
      durationMs: 1200,
    },
    {
      kind: 'narrate',
      text: 'Bouteille reconnue : le Morgon 2023 de Jean Foillard — prix, service, accords, et les autres candidats possibles en dessous.',
      target: 'scan-resultat',
    },
    { kind: 'click', target: 'scan-ajouter' },
    {
      kind: 'narrate',
      text: 'Ajoutée à la cave en un geste. On peut aussi ouvrir sa fiche complète.',
      target: 'scan-ajouter',
      durationMs: 2600,
    },
    { kind: 'click', target: 'scan-fiche-complete' },
    {
      kind: 'narrate',
      text: 'La fiche du catalogue : cépages, garde, température de service, accords mets-vins.',
      target: 'bouteille-fiche',
    },
    {
      kind: 'narrate',
      text: 'À vous de jouer ! Échap quitte la démo — votre vraie cave n’a pas été modifiée.',
    },
  ],
};
