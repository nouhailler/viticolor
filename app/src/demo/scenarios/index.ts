import type { DemoScenario } from '../types';
import { ajouterBouteille } from './ajouter-bouteille';
import { scannerEtiquette } from './scanner-etiquette';

/** Registre des scénarios : ?demo=<id> et liste de l'écran Paramètres. */
export const DEMO_SCENARIOS: DemoScenario[] = [ajouterBouteille, scannerEtiquette];
