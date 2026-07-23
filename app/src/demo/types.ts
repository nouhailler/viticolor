import type { ScreenId } from '../types';
import type { State } from '../store';

/** Valeur d'un attribut data-demo-id. Seul mécanisme de ciblage autorisé
 *  (jamais de classe CSS ni de sélecteur structurel). */
export type DemoTarget = string;

// ─── Étapes ───

interface StepBase {
  /** Note d'intention pour l'auteur du scénario, jamais affichée. */
  comment?: string;
}

/** Change d'écran via le store (pas de clic simulé : fiable et instantané). */
export interface NavigateStep extends StepBase {
  kind: 'navigate';
  screen: ScreenId;
  /** État additionnel du routeur, ex. { regionId: 'jura', appOpen: 0 }. */
  extra?: Partial<State>;
}

/** Déplace le curseur virtuel sur la cible, la surligne, puis clique. */
export interface ClickStep extends StepBase {
  kind: 'click';
  target: DemoTarget;
}

/** Frappe du texte caractère par caractère dans un input/textarea ciblé. */
export interface TypeStep extends StepBase {
  kind: 'type';
  target: DemoTarget;
  text: string;
  /** ms entre deux caractères (défaut moteur ; frappe d'un bloc en reduced-motion). */
  charDelayMs?: number;
}

/** Pause scénarisée. Toujours divisée par la vitesse courante. */
export interface WaitStep extends StepBase {
  kind: 'wait';
  ms: number;
}

/** Surbrillance seule (pas de clic) — pour « regardez ici ». */
export interface HighlightStep extends StepBase {
  kind: 'highlight';
  target: DemoTarget;
  durationMs?: number;
}

/** Bulle de narration, avancement automatique. Sans target : bandeau bas centré. */
export interface NarrateStep extends StepBase {
  kind: 'narrate';
  text: string;
  /** Ancre facultative : la bulle se positionne près de cet élément. */
  target?: DemoTarget;
  /** Défaut : durée calculée sur la longueur du texte (bornée). */
  durationMs?: number;
}

export type DemoStep =
  | NavigateStep
  | ClickStep
  | TypeStep
  | WaitStep
  | HighlightStep
  | NarrateStep;

// ─── Scénario ───

/** Un scénario = données. Aucune logique, aucun import du moteur. */
export interface DemoScenario {
  /** Slug : valeur de ?demo=… et clé du registre. */
  id: string;
  /** Titre affiché dans la barre de contrôle et dans Paramètres. */
  title: string;
  description?: string;
  /**
   * État de départ injecté dans le store AVANT la première étape (cave de
   * démo, écran initial…). Pendant toute la démo la persistance localStorage
   * est gelée ; à la sortie, l'état pré-démo est restauré intégralement.
   */
  seed?: Partial<State>;
  steps: DemoStep[];
}
