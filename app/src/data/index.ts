// Point d'entrée typé pour toutes les données embarquées (JSON).
import type {
  Region,
  Atlas,
  Terroir,
  CaveBottle,
  Accord,
  QuizQuestion,
  CepageLexique,
  CepageFiche,
  Millesime,
  AromeFamille,
  HistArticle,
  CoteVin,
  Route,
  VendangesData,
  CollectionObjectif,
  OnboardingSlide,
  DemoTips,
  DecouverteDomaine,
  GlossaireTerme,
  GlossaireMedia,
  Wine,
} from '../types';

import regions from './regions.json';
import atlas from './atlas.json';
import terroir from './terroir.json';
import cave from './cave.json';
import accords from './accords.json';
import quiz from './quiz.json';
import cepagesLexique from './cepagesLexique.json';
import cepages from './cepages.json';
import millesimes from './millesimes.json';
import aromes from './aromes.json';
import histoire from './histoire.json';
import cotesVins from './cotesVins.json';
import routes from './routes.json';
import vendanges from './vendanges.json';
import collection from './collection.json';
import onboarding from './onboarding.json';
import demoTips from './demoTips.json';
import decouverteDomaines from './decouverteDomaines.json';
import decouverteAnecdotes from './decouverteAnecdotes.json';
import glossaire from './glossaire.json';
import glossaireMedia from './glossaire-media.json';
import wines from './wines.json';

export const REGIONS = regions as Region[];
export const ATLAS = atlas as unknown as Atlas;
export const TERROIR = terroir as unknown as Terroir;
export const CAVE = cave as CaveBottle[];
export const ACCORDS = accords as Accord[];
export const QUIZ = quiz as QuizQuestion[];
export const CEPAGES_LEXIQUE = cepagesLexique as CepageLexique[];
export const CEPAGES = cepages as CepageFiche[];
export const MILLESIMES = millesimes as Millesime[];
export const AROMES = aromes as AromeFamille[];
export const HISTOIRE = histoire as HistArticle[];
export const COTES_VINS = cotesVins as CoteVin[];
export const ROUTES = routes as Route[];
export const VENDANGES = vendanges as VendangesData;
export const COLLECTION = collection as CollectionObjectif[];
export const ONBOARDING = onboarding as OnboardingSlide[];
export const DEMO_TIPS = demoTips as DemoTips;
export const DECOUVERTE_DOMAINES = decouverteDomaines as DecouverteDomaine[];
export const DECOUVERTE_ANECDOTES = decouverteAnecdotes as string[];
export const GLOSSAIRE = glossaire as GlossaireTerme[];
export const GLOSSAIRE_MEDIA = glossaireMedia as Record<string, GlossaireMedia>;
export const WINES = wines as unknown as Wine[];
