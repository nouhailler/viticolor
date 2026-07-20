#!/usr/bin/env node
/**
 * Génère `src/data/france-rivers.ts` : le tracé des principaux fleuves et
 * rivières français, projeté dans EXACTEMENT le même repère que le contour de
 * `france-map.ts` (viewBox 0 0 1000 986).
 *
 *   node scripts/build-rivers.mjs
 *
 * On ne repart pas du GeoJSON source du contour : la projection utilisée par
 * build-france-map.mjs (équirectangulaire calée sur 46,6°) est AFFINE, donc
 *   X = a·lon + b     Y = c·lat + d
 * On retrouve (a, b, c, d) par régression sur les 14 régions viticoles, dont on
 * connaît à la fois les coordonnées réelles (REGION_COORDS, ci-dessous) et leur
 * position déjà projetée dans le viewBox (REGION_POINTS, lu dans france-map.ts).
 * Les résidus affichés confirment que l'ajustement est quasi parfait (< 1 px).
 *
 * Les tracés de fleuves sont des polylignes de points (lon, lat) relevés le long
 * du cours réel ; simplifiés à l'échelle d'un écran, ils n'ont aucune valeur
 * hydrographique. Source des repères : cours d'eau et villes usuels (domaine
 * public géographique).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = path.join(ROOT, 'src', 'data', 'france-map.ts');
const OUT = path.join(ROOT, 'src', 'data', 'france-rivers.ts');

// Coordonnées réelles des 14 repères régionaux (mêmes valeurs que
// build-france-map.mjs). Servent uniquement à retrouver la transformation.
const REGION_COORDS = {
  alsace: { lat: 48.08, lon: 7.36 },
  beaujolais: { lat: 46.03, lon: 4.62 },
  bordeaux: { lat: 44.87, lon: -0.46 },
  bourgogne: { lat: 47.02, lon: 4.84 },
  champagne: { lat: 49.04, lon: 3.96 },
  corse: { lat: 42.32, lon: 9.15 },
  jura: { lat: 46.9, lon: 5.77 },
  languedoc: { lat: 43.35, lon: 3.05 },
  loire: { lat: 47.35, lon: 0.62 },
  lorraine: { lat: 48.68, lon: 5.85 },
  provence: { lat: 43.45, lon: 6.0 },
  rhone: { lat: 44.75, lon: 4.83 },
  savoie: { lat: 45.55, lon: 5.93 },
  sudouest: { lat: 44.0, lon: 0.85 },
};

// ── Lecture des positions projetées dans france-map.ts ───────────────────────
const mapSrc = fs.readFileSync(MAP, 'utf8');
const REGION_POINTS = {};
for (const m of mapSrc.matchAll(/(\w+):\s*\{\s*x:\s*([\d.-]+),\s*y:\s*([\d.-]+)/g)) {
  REGION_POINTS[m[1]] = { x: parseFloat(m[2]), y: parseFloat(m[3]) };
}

// ── Ajustement affine (moindres carrés) ──────────────────────────────────────
function fit(pairs) {
  const n = pairs.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pairs) {
    sx += x; sy += y; sxx += x * x; sxy += x * y;
  }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return { m, b };
}

const ids = Object.keys(REGION_COORDS).filter((id) => REGION_POINTS[id]);
const { m: a, b } = fit(ids.map((id) => [REGION_COORDS[id].lon, REGION_POINTS[id].x]));
const { m: c, b: d } = fit(ids.map((id) => [REGION_COORDS[id].lat, REGION_POINTS[id].y]));

const projX = (lon) => a * lon + b;
const projY = (lat) => c * lat + d;

let maxRes = 0;
for (const id of ids) {
  const dx = projX(REGION_COORDS[id].lon) - REGION_POINTS[id].x;
  const dy = projY(REGION_COORDS[id].lat) - REGION_POINTS[id].y;
  maxRes = Math.max(maxRes, Math.hypot(dx, dy));
}

// ── Cours d'eau : polylignes de points (lon, lat) le long du cours réel ───────
const RIVERS = [
  { id: 'loire', name: 'La Loire', pts: [
    [4.22, 44.84], [4.07, 45.35], [4.07, 46.03], [3.9, 46.5], [3.16, 46.99],
    [2.6, 47.3], [2.0, 47.75], [1.91, 47.9], [1.4, 47.6], [0.69, 47.39],
    [0.05, 47.32], [-0.55, 47.42], [-1.15, 47.25], [-1.55, 47.21], [-2.2, 47.28],
  ] },
  { id: 'garonne', name: 'La Garonne', pts: [
    [0.72, 43.11], [1.15, 43.35], [1.44, 43.6], [1.1, 43.9], [0.62, 44.2],
    [0.1, 44.5], [-0.35, 44.72], [-0.57, 44.87], [-0.55, 45.03], [-0.7, 45.3],
    [-0.86, 45.45], [-1.03, 45.58],
  ] },
  { id: 'dordogne', name: 'La Dordogne', pts: [
    [1.48, 44.9], [0.9, 44.85], [0.48, 44.85], [0.0, 44.9], [-0.24, 44.91],
    [-0.55, 45.03],
  ] },
  { id: 'lot', name: 'Le Lot', pts: [
    [2.57, 44.64], [1.9, 44.47], [1.44, 44.45], [0.9, 44.4], [0.34, 44.3],
  ] },
  { id: 'rhone', name: 'Le Rhône', pts: [
    [6.15, 46.2], [5.83, 45.98], [5.3, 45.8], [4.83, 45.76], [4.82, 45.3],
    [4.89, 44.93], [4.65, 44.6], [4.81, 44.14], [4.81, 43.95], [4.63, 43.68],
    [4.85, 43.35],
  ] },
  { id: 'saone', name: 'La Saône', pts: [
    [5.6, 47.6], [5.39, 47.19], [4.85, 46.78], [4.83, 46.31], [4.83, 45.95],
    [4.83, 45.76],
  ] },
  { id: 'doubs', name: 'Le Doubs', pts: [
    [6.8, 47.51], [6.02, 47.24], [5.49, 47.09], [5.02, 46.9],
  ] },
  { id: 'isere', name: "L'Isère", pts: [
    [6.53, 45.48], [6.39, 45.67], [6.05, 45.5], [5.72, 45.19], [5.3, 45.1],
    [4.89, 44.93],
  ] },
  { id: 'marne', name: 'La Marne', pts: [
    [5.14, 48.11], [4.95, 48.64], [4.36, 48.96], [3.96, 49.04], [3.4, 49.04],
    [2.9, 48.95], [2.42, 48.81],
  ] },
  { id: 'seine', name: 'La Seine', pts: [
    [4.2, 47.9], [4.08, 48.3], [3.7, 48.5], [2.95, 48.38], [2.35, 48.85],
    [1.9, 49.0], [1.1, 49.44], [0.4, 49.45], [0.1, 49.49],
  ] },
  { id: 'rhin', name: 'Le Rhin', pts: [
    [7.59, 47.55], [7.55, 47.9], [7.6, 48.02], [7.75, 48.35], [7.8, 48.58],
    [8.0, 48.9], [8.1, 49.02],
  ] },
  { id: 'moselle', name: 'La Moselle', pts: [
    [6.45, 48.17], [5.9, 48.68], [6.18, 49.12], [6.17, 49.36], [6.36, 49.46],
  ] },
];

const r2 = (n) => Math.round(n * 10) / 10;
const rivers = RIVERS.map(({ id, name, pts }) => {
  const d2 = 'M' + pts.map(([lon, lat]) => `${r2(projX(lon))} ${r2(projY(lat))}`).join('L');
  return { id, name, d: d2 };
});

const ts = `// GÉNÉRÉ par scripts/build-rivers.mjs — ne pas éditer à la main.
//
// Principaux cours d'eau français, projetés dans le repère de france-map.ts
// (même viewBox). Tracés simplifiés pour l'affichage mobile : aucune valeur
// hydrographique. Voir l'en-tête du script pour la méthode de calage.

export interface River {
  id: string;
  name: string;
  /** Polyligne SVG dans le repère FRANCE_VIEWBOX. */
  d: string;
}

export const FRANCE_RIVERS: River[] = [
${rivers.map((r) => `  { id: ${JSON.stringify(r.id)}, name: ${JSON.stringify(r.name)}, d: '${r.d}' },`).join('\n')}
];
`;

fs.writeFileSync(OUT, ts);
console.log(`✅ ${path.relative(ROOT, OUT)}`);
console.log(`   transform  X = ${a.toFixed(4)}·lon + ${b.toFixed(2)}   Y = ${c.toFixed(4)}·lat + ${d.toFixed(2)}`);
console.log(`   résidu max ${maxRes.toFixed(2)} px sur ${ids.length} repères · ${rivers.length} cours d'eau`);
