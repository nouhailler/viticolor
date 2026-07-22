import { normalize } from './helpers';
import type { Wine } from '../types';

// ─── Rapprochement du texte OCR d'une étiquette avec le catalogue ───
// Le texte brut d'une étiquette est bruité (accents mal lus, mentions légales…) :
// on compare des mots significatifs, pas des phrases.

const clean = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, ' ');

// Mots trop fréquents sur une étiquette pour identifier quoi que ce soit.
const STOP = new Set([
  'domaine', 'chateau', 'clos', 'maison', 'les', 'la', 'le', 'de', 'du', 'des', 'et',
  'grand', 'cru', 'vin', 'vins', 'mis', 'en', 'bouteille', 'par', 'propriete',
  'appellation', 'controlee', 'protegee', 'origine', 'produit', 'france', 'recolte',
  'alc', 'vol', 'contient', 'sulfites',
]);

const toks = (s: string) => [...new Set(clean(s).split(' ').filter((t) => t.length >= 3 && !STOP.has(t)))];

export interface LabelMatch {
  wine: Wine;
  score: number;
}

/** Les vins du catalogue les plus proches du texte lu (score 0–1, top 3).
 *  Vide si rien ne ressemble à une étiquette connue — on l'assume. */
export function matchLabel(all: Wine[], text: string): LabelMatch[] {
  const hay = clean(text);
  if (hay.trim().length < 3) return [];
  const years = (text.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);

  const out: LabelMatch[] = [];
  for (const w of all) {
    // L'identité du vin est portée par domaine + cuvée ; l'appellation conforte.
    const idTokens = toks(`${w.domaine} ${w.cuvee ?? ''}`);
    if (idTokens.length === 0) continue;
    const idHit = idTokens.filter((t) => hay.includes(t)).length / idTokens.length;
    if (idHit === 0) continue; // aucun mot distinctif du vin : pas une correspondance
    const appTokens = toks(w.appellation);
    const appHit = appTokens.length ? appTokens.filter((t) => hay.includes(t)).length / appTokens.length : 0;
    let score = idHit * 0.7 + appHit * 0.3;
    if (w.millesime && years.includes(w.millesime)) score += 0.15;
    if (score >= 0.45) out.push({ wine: w, score: Math.min(1, score) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}
