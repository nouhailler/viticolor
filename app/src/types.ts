// ─── Types du modèle de données Viticolor ───
// Chaque interface décrit la forme d'un fichier JSON dans src/data/.

export interface Appellation {
  n: string;
  t: string;
}

export interface Region {
  id: string;
  name: string;
  tint: string;
  aoc: number;
  ha: string;
  hl: string;
  tagline: string;
  cepages: string[];
  appellations: Appellation[];
  desc: string;
  /** Photo de bandeau (fichier dans public/regions/), + crédit « Auteur · Licence ». */
  img?: string;
  credit?: string;
}

export interface AtlasDomaine {
  n: string;
  c: string; // "Bio" | "HVE"
  v: string;
}

export interface AtlasEntry {
  pos: [number, number];
  hist: string;
  climat: string;
  terr: string;
  spec: string[];
  dom: AtlasDomaine[];
  vil: string[];
}

export type Atlas = Record<string, AtlasEntry>;

export interface TerroirEntry {
  sols: [string, string][];
  alt: [number, number];
  micro: string[];
}

export type Terroir = Record<string, TerroirEntry>;

export interface CaveBottle {
  id: string;
  name: string;
  meta: string;
  apogee: string;
  from: number;
  to: number;
  prix: number;
  delta: number;
  color: string; // rouge | blanc | effervescent
  tint: string;
  def: number; // quantité par défaut
}

/** Bouteille vivante de « Ma cave » (persistée) : quantité et prix modifiables,
 *  lien facultatif vers une fiche du catalogue quand elle en provient. */
export interface CaveItem extends Omit<CaveBottle, 'def'> {
  qty: number;
  wineId?: string;
}

export interface Accord {
  /** Catégorie de plat : apero | entree | mer | viande | fromage | dessert */
  cat: string;
  plat: string;
  vin: string;
  pourquoi: string;
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
  ex: string;
}

export interface CepageLexique {
  nom: string;
  type: string;
  tint: string;
  desc: string;
}

export interface CepageFiche {
  nom: string;
  couleur: string; // Rouge | Blanc
  tint: string;
  origine: string;
  hist: string;
  aromes: string[];
  acid: number;
  sucre: number;
  tanins: number;
  tTxt: string;
  garde: string;
  reg: string[];
}

export interface Millesime {
  y: number;
  note: number;
  soleil: number;
  pluie: number;
  garde: number;
  txt: string;
}

export interface AromeItem {
  nom: string;
  repere: string;
  ou: string;
}

export interface AromeFamille {
  nom: string;
  tint: string;
  origine: string;
  desc: string;
  astuce: string;
  aromes: AromeItem[];
}

export interface HistArticle {
  epoque: string;
  duree: string;
  titre: string;
  chapo: string;
  paras: string[];
  anecdote: string;
}

export interface CoteVin {
  /** Vin du catalogue dont la cote est dérivée (dernier point = prixMoyen). */
  wineId: string;
  nom: string;
  meta: string;
  serie: number[];
}

export interface RouteEtape {
  lieu: string;
  dist: string;
  txt: string;
  halte: string;
}

export interface Route {
  nom: string;
  titre: string;
  sous: string;
  km: number;
  jours: string;
  etapes: RouteEtape[];
}

export interface VendangeRegion {
  nom: string;
  d: number; // jour de début depuis le 1er août
  f: number; // jour de fin
  ic: string; // icône météo
  mc: string; // météo courte
  txt: string;
}

export interface CollectionObjectif {
  id: string;
  titre: string;
  total: number;
  sous: string;
  items: string[]; // "nom|meta"
}

export interface OnboardingSlide {
  icone: string;
  titre: string;
  txt: string;
}

export type DemoTips = Record<string, string>;

export interface DecouverteDomaine {
  nom: string;
  lieu: string;
  txt: string;
}

export type GlossaireFamille =
  | 'degustation'
  | 'viticulture'
  | 'vinification'
  | 'elevage'
  | 'contenant'
  | 'defaut'
  | 'classification'
  | 'type';

export interface GlossaireTerme {
  terme: string;
  def: string;
  /** Famille du terme, posée par scripts/tag-glossaire.mjs. */
  cat: GlossaireFamille;
}

/** Illustration d'un terme (fichier dans public/glossaire/) + crédit. */
export interface GlossaireMedia {
  img: string;
  credit: string;
}

// ─── État persisté (carnet de dégustation) ───
export interface DegustationCrit {
  robe: number;
  nez: number;
  bouche: number;
  longueur: number;
  equilibre: number;
  plaisir: number;
}

export interface DegustationNote {
  vin: string;
  score: number;
  stars: number;
  prix: string;
  lieu: string;
  crit: DegustationCrit;
  texte: string;
  date: string;
  photo?: string; // data URL optionnelle
}

// ─── Catalogue de vins (référentiel enrichi progressivement) ───
export type Couleur = 'rouge' | 'blanc' | 'rosé' | 'effervescent' | 'liquoreux';

export interface Wine {
  id: string; // slug stable : domaine-appellation-millesime
  domaine: string;
  cuvee: string | null;
  appellation: string;
  regionId: string; // lien vers regions.json (id)
  couleur: Couleur;
  millesime: number | null; // null = non millésimé
  cepages: string;
  degre: string | null;
  prixMoyen: number | null; // €
  temperature: string | null;
  garde: string | null;
  notes: string | null;
  accords: string[];
  /** Champs comblés automatiquement faute de source (transparence). */
  comble?: string[];
}

// ─── Navigation ───
export type ScreenId =
  | 'home'
  | 'regions'
  | 'region'
  | 'carte'
  | 'scanner'
  | 'cave'
  | 'savoir'
  | 'degustation'
  | 'accords'
  | 'search'
  | 'millesimes'
  | 'collection'
  | 'vendanges'
  | 'glossaire'
  | 'routes'
  | 'cotes'
  | 'histoire'
  | 'aromes'
  | 'bouteilles'
  | 'import'
  | 'parametres';

export type RegionsView = 'carte' | 'liste' | 'cepages' | 'millesimes';
