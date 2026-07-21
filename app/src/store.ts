import { useRef, useSyncExternalStore } from 'react';
import type {
  ScreenId,
  RegionsView,
  DegustationNote,
  DegustationCrit,
  GlossaireFamille,
} from './types';
import seedNotes from './data/seedNotes.json';

const PREFIX = 'viticolor_';

// ─── Wrapper localStorage préfixé ───
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / mode privé — on ignore */
  }
}

const EMPTY_CRIT: DegustationCrit = {
  robe: 3,
  nez: 3,
  bouche: 3,
  longueur: 3,
  equilibre: 3,
  plaisir: 3,
};

export interface State {
  // Navigation
  screen: ScreenId;
  prevScreen: ScreenId;
  /** Pile des positions quittées, pour un retour fidèle (voir NAV_KEYS). */
  history: NavSnapshot[];
  regionId: string | null;
  menuOpen: boolean;

  // Régions
  regionsView: RegionsView;
  carteRegion: string | null;
  carteZoom: number;
  carteInfo: string | null;
  cepFilter: 'tous' | 'rouge' | 'blanc';
  cepOpen: number;
  appOpen: number;
  millSel: number;
  millMetric: 'note' | 'soleil' | 'garde';
  parcelSel: number;
  parcelOverlay: 'sol' | 'expo' | 'alt' | 'micro';
  zoom: number;

  // Historique millésimes
  millHistSel: number;

  // Cave & recherche
  caveFilter: 'tous' | 'rouge' | 'blanc' | 'effervescent';
  query: string;

  // Catalogue Bouteilles
  wineQuery: string;
  wineColor: 'tous' | 'rouge' | 'blanc' | 'rosé' | 'effervescent' | 'liquoreux';
  wineRegionFilter: string; // 'toutes' | id de région
  wineSel: string | null; // id du vin ouvert en fiche

  // Scanner
  scanned: boolean;
  scanAdded: boolean;

  // Écrans divers
  collOpen: string | null;
  vendSel: number;
  actuCat: string;
  glossQuery: string;
  glossLettre: string | null;
  glossCat: GlossaireFamille | null;
  glossSel: string | null;
  routeSel: number;
  coteSel: number;
  cotePeriode: 5 | 10;
  histOpen: number | null;
  aromSel: number;
  accordOpen: number;
  accordCat: string;

  // Quiz
  quizIndex: number;
  quizPicked: number | null;
  quizScore: number;
  quizDone: boolean;

  // Carnet — formulaire
  formVin: string;
  formScore: number;
  formTexte: string;
  formPrix: string;
  formLieu: string;
  formStars: number;
  formCrit: DegustationCrit;
  formPhoto: string;

  // Onboarding & démo
  obDone: boolean;
  obStep: number;
  demoOn: boolean;
  demoDismissed: Record<string, boolean>;

  // Données persistées
  favs: string[];
  qtys: Record<string, number>;
  notes: DegustationNote[];
  collChecked: Record<string, boolean>;
}

/** Champs qui définissent « où l'on est » dans l'app : ils sont capturés dans
 *  l'historique pour restituer non seulement l'écran mais aussi son contexte
 *  (région ouverte, fiche vin, filtre, terme de glossaire…). On y exclut à
 *  dessein les données persistées, les formulaires, le quiz et l'onboarding :
 *  un retour ne doit jamais annuler une saisie ni faire régresser une partie. */
const NAV_KEYS = [
  'screen', 'regionId',
  'regionsView', 'carteRegion', 'carteZoom', 'carteInfo', 'cepFilter',
  'cepOpen', 'appOpen', 'millSel', 'millMetric', 'parcelSel', 'parcelOverlay',
  'zoom', 'millHistSel', 'caveFilter', 'query', 'wineQuery', 'wineColor',
  'wineRegionFilter', 'wineSel', 'scanned', 'scanAdded', 'collOpen', 'vendSel',
  'actuCat', 'glossQuery', 'glossLettre', 'glossCat', 'glossSel', 'routeSel',
  'coteSel', 'cotePeriode', 'histOpen', 'aromSel', 'accordOpen', 'accordCat',
] as const;
type NavKey = (typeof NAV_KEYS)[number];
export type NavSnapshot = Pick<State, NavKey>;

function snapshot(s: State): NavSnapshot {
  const snap = {} as Record<NavKey, unknown>;
  for (const k of NAV_KEYS) snap[k] = s[k];
  return snap as NavSnapshot;
}

/** Profondeur maximale de l'historique : au-delà, on oublie les plus anciens. */
const HISTORY_MAX = 50;

function initialState(): State {
  return {
    screen: 'home',
    prevScreen: 'home',
    history: [],
    regionId: null,
    menuOpen: false,

    regionsView: 'carte',
    carteRegion: null,
    carteZoom: 1,
    carteInfo: null,
    cepFilter: 'tous',
    cepOpen: 0,
    appOpen: -1,
    millSel: 7,
    millMetric: 'note',
    parcelSel: 0,
    parcelOverlay: 'sol',
    zoom: 1,

    millHistSel: 7,

    caveFilter: 'tous',
    query: '',

    wineQuery: '',
    wineColor: 'tous',
    wineRegionFilter: 'toutes',
    wineSel: null,

    scanned: false,
    scanAdded: false,

    collOpen: null,
    vendSel: 0,
    actuCat: 'tout',
    glossQuery: '',
    glossLettre: null,
    glossCat: null,
    glossSel: null,
    routeSel: 0,
    coteSel: 0,
    cotePeriode: 10,
    histOpen: null,
    aromSel: 0,
    accordOpen: -1,
    accordCat: 'tous',

    quizIndex: 0,
    quizPicked: null,
    quizScore: 0,
    quizDone: false,

    formVin: '',
    formScore: 90,
    formTexte: '',
    formPrix: '',
    formLieu: '',
    formStars: 4,
    formCrit: { ...EMPTY_CRIT },
    formPhoto: '',

    obDone: load('onboard', false),
    obStep: 0,
    demoOn: load('demo', true),
    demoDismissed: load('demoDismissed', {} as Record<string, boolean>),

    favs: load<string[]>('favs', ['bourgogne']),
    qtys: load<Record<string, number>>('qtys', {}),
    notes: load<DegustationNote[]>('notes', seedNotes as DegustationNote[]),
    collChecked: load<Record<string, boolean>>('coll', {}),
  };
}

// ─── Store externe minimal (observer) ───
let state: State = initialState();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getState(): State {
  return state;
}

type Updater = Partial<State> | ((s: State) => Partial<State>);
export function setState(updater: Updater): void {
  const patch = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Hook de sélection typé.
// La snapshot est mémoïsée sur l'identité de `state` : tant que le store n'a pas
// changé, on renvoie exactement la même valeur — même si le sélecteur construit un
// nouvel objet à chaque appel (contrat getSnapshot de useSyncExternalStore).
export function useStore<T>(selector: (s: State) => T): T {
  const cache = useRef<{ state: State; value: T } | null>(null);
  const getSnapshot = (): T => {
    if (!cache.current || cache.current.state !== state) {
      cache.current = { state, value: selector(state) };
    }
    return cache.current.value;
  };
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ─── Actions ───
const rootScreens: ScreenId[] = ['home', 'regions', 'scanner', 'cave', 'savoir'];
export const isRootScreen = (s: ScreenId) => rootScreens.includes(s);

export const actions = {
  go(screen: ScreenId, extra: Partial<State> = {}) {
    setState((s) => ({
      history: [...s.history, snapshot(s)].slice(-HISTORY_MAX),
      prevScreen: s.screen,
      screen,
      menuOpen: false,
      ...extra,
    }));
    scrollTop();
  },
  /** Dépile la dernière position et la restaure telle quelle (écran + contexte).
   *  À défaut d'historique, on retombe sur l'accueil. */
  goBack() {
    setState((s) => {
      const prev = s.history[s.history.length - 1];
      if (!prev) return { screen: 'home', menuOpen: false };
      return { ...prev, history: s.history.slice(0, -1), menuOpen: false };
    });
    scrollTop();
  },
  toggleMenu() {
    setState((s) => ({ menuOpen: !s.menuOpen }));
  },

  toggleFav(id: string) {
    setState((s) => {
      const favs = s.favs.includes(id) ? s.favs.filter((f) => f !== id) : [...s.favs, id];
      save('favs', favs);
      return { favs };
    });
  },

  setQty(id: string, current: number, delta: number) {
    setState((s) => {
      const qtys = { ...s.qtys, [id]: Math.max(0, current + delta) };
      save('qtys', qtys);
      return { qtys };
    });
  },

  addNote(note: DegustationNote) {
    setState((s) => {
      const notes = [note, ...s.notes];
      save('notes', notes);
      return {
        notes,
        formVin: '',
        formTexte: '',
        formScore: 90,
        formPrix: '',
        formLieu: '',
        formStars: 4,
        formCrit: { ...EMPTY_CRIT },
        formPhoto: '',
      };
    });
  },

  toggleColl(key: string) {
    setState((s) => {
      const collChecked = { ...s.collChecked };
      if (collChecked[key]) delete collChecked[key];
      else collChecked[key] = true;
      save('coll', collChecked);
      return { collChecked };
    });
  },

  finishOnboarding() {
    save('onboard', true);
    setState({ obDone: true });
  },
  nextOnboarding(last: boolean) {
    if (last) actions.finishOnboarding();
    else setState((s) => ({ obStep: s.obStep + 1 }));
  },

  toggleDemo() {
    setState((s) => {
      const demoOn = !s.demoOn;
      save('demo', demoOn);
      // Réactiver le mode démo réaffiche tous les tips ; on remet donc la liste
      // des tips fermés à zéro (et on la persiste).
      save('demoDismissed', {});
      return { demoOn, demoDismissed: {} };
    });
  },
  dismissDemo(screen: string) {
    setState((s) => {
      const demoDismissed = { ...s.demoDismissed, [screen]: true };
      save('demoDismissed', demoDismissed);
      return { demoDismissed };
    });
  },
};

// Remet la zone de contenu en haut lors d'une navigation.
function scrollTop() {
  requestAnimationFrame(() => {
    document.querySelector('.vc-content')?.scrollTo(0, 0);
  });
}
