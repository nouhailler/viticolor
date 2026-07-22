import { fr } from './helpers';
import type { CaveItem, Wine } from '../types';

const YEAR = 2026;

const inWindow = (from: number, to: number) => from > 0 && from <= YEAR && to >= YEAR;

export interface CaveAlert {
  id: string;
  name: string;
  msg: string;
}

export function computeCave(items: CaveItem[]) {
  const totalBottles = items.reduce((n, b) => n + b.qty, 0);
  const totalVal = items.reduce((n, b) => n + b.qty * b.prix, 0);
  const trendPct = totalVal
    ? Math.round(items.reduce((n, b) => n + b.qty * b.prix * b.delta, 0) / totalVal)
    : 0;

  const alerts: CaveAlert[] = items
    .filter((b) => b.qty > 0 && inWindow(b.from, b.to))
    .map((b) => ({
      id: b.id,
      name: b.name,
      msg:
        b.from >= YEAR - 1
          ? `Entre dans sa fenêtre optimale · ${b.apogee}`
          : `En pleine apogée · fenêtre ${b.apogee}`,
    }));

  return {
    totalBottles,
    totalVal,
    trendPct,
    alerts,
    caveValue: `${fr(totalVal)} €`,
    caveTrend: `${trendPct >= 0 ? '+' : ''}${trendPct} % sur 12 mois`,
    caveStats: `${totalBottles} bouteille${totalBottles > 1 ? 's' : ''}`,
  };
}

export function caveBottles(items: CaveItem[], filter: string) {
  return items
    .filter((b) => filter === 'tous' || b.color === filter)
    .map((b) => ({
      ...b,
      cote: `${fr(b.prix)} €`,
      inWindowFlag: inWindow(b.from, b.to),
      deltaLabel: b.delta === 0 ? 'cote stable' : `${b.delta > 0 ? '+' : ''}${b.delta} % / 12 mois`,
      deltaColor: b.delta >= 0 ? 'var(--positive-soft)' : 'var(--negative-soft)',
    }));
}

// ─── Ajout depuis le catalogue ───

const COULEUR_TINT: Record<string, string> = {
  rouge: '#6e1f2e',
  blanc: '#c9a44d',
  rosé: '#d98a8a',
  effervescent: '#d8bc74',
  liquoreux: '#b08d3e',
};

// Le filtre de la cave regroupe les liquoreux avec les blancs (comme l'Yquem de démo).
const COULEUR_FILTRE: Record<string, string> = {
  rouge: 'rouge',
  blanc: 'blanc',
  rosé: 'rosé',
  effervescent: 'effervescent',
  liquoreux: 'blanc',
};

/** Fenêtre de garde depuis un champ libre ("2024–2045", "dès maintenant"…) :
 *  premières et dernières années trouvées, sinon 0/0 (fenêtre inconnue). */
function parseGarde(garde: string | null): [number, number] {
  const years = (garde ?? '').match(/\b(19|20)\d{2}\b/g)?.map(Number) ?? [];
  if (years.length === 0) return [0, 0];
  return [Math.min(...years), Math.max(...years)];
}

/** Construit la bouteille de cave correspondant à un vin du catalogue.
 *  L'id est dérivé du vin : ré-ajouter le même vin incrémente la quantité. */
export function wineToCaveItem(w: Wine): CaveItem {
  const [from, to] = parseGarde(w.garde);
  return {
    id: `w-${w.id}`,
    wineId: w.id,
    name: `${w.domaine}${w.cuvee ? ` « ${w.cuvee} »` : ''}${w.millesime ? ` ${w.millesime}` : ''}`,
    meta: `${w.appellation} · ${w.couleur}`,
    apogee: from > 0 ? `${from}–${to}` : (w.garde ?? 'garde non renseignée'),
    from,
    to,
    prix: w.prixMoyen ?? 0,
    delta: 0,
    color: COULEUR_FILTRE[w.couleur] ?? 'rouge',
    tint: COULEUR_TINT[w.couleur] ?? 'var(--gold-border)',
    qty: 1,
  };
}
