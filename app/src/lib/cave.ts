import { CAVE } from '../data';
import { fr } from './helpers';

const YEAR = 2026;

export const qtyOf = (qtys: Record<string, number>, id: string): number => {
  if (qtys[id] !== undefined) return qtys[id];
  return CAVE.find((b) => b.id === id)!.def;
};

const inWindow = (from: number, to: number) => from <= YEAR && to >= YEAR;

export interface CaveAlert {
  name: string;
  msg: string;
}

export function computeCave(qtys: Record<string, number>) {
  const totalBottles = CAVE.reduce((n, b) => n + qtyOf(qtys, b.id), 0);
  const totalVal = CAVE.reduce((n, b) => n + qtyOf(qtys, b.id) * b.prix, 0);
  const trendPct = totalVal
    ? Math.round(CAVE.reduce((n, b) => n + qtyOf(qtys, b.id) * b.prix * b.delta, 0) / totalVal)
    : 0;

  const alerts: CaveAlert[] = CAVE.filter((b) => qtyOf(qtys, b.id) > 0 && inWindow(b.from, b.to)).map(
    (b) => ({
      name: b.name,
      msg:
        b.from >= YEAR - 1
          ? `Entre dans sa fenêtre optimale · ${b.apogee}`
          : `En pleine apogée · fenêtre ${b.apogee}`,
    }),
  );

  return {
    totalBottles,
    totalVal,
    trendPct,
    alerts,
    caveValue: `${fr(totalVal)} €`,
    caveTrend: `+${trendPct} % sur 12 mois`,
    caveStats: `${totalBottles} bouteilles`,
  };
}

export function caveBottles(qtys: Record<string, number>, filter: string) {
  return CAVE.filter((b) => filter === 'tous' || b.color === filter).map((b) => ({
    ...b,
    qty: qtyOf(qtys, b.id),
    cote: `${fr(b.prix)} €`,
    inWindowFlag: inWindow(b.from, b.to),
    deltaLabel: `${b.delta >= 0 ? '+' : ''}${b.delta} % / 12 mois`,
    deltaColor: b.delta >= 0 ? 'var(--positive-soft)' : 'var(--negative-soft)',
  }));
}
