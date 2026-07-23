import type { DemoScenario } from '../types';
import { ajouterBouteille } from './ajouter-bouteille';

/** Registre des scénarios : ?demo=<id> et liste de l'écran Paramètres. */
export const DEMO_SCENARIOS: DemoScenario[] = [ajouterBouteille];
