#!/usr/bin/env node
/**
 * Génère `src/data/france-map.ts` : le contour de la France métropolitaine en
 * chemins SVG, plus la projection des 14 régions viticoles à leurs vraies
 * coordonnées.
 *
 *   node scripts/build-france-map.mjs <metropole.geojson>
 *
 * La source (contour IGN via github.com/gregoiredavid/france-geojson) est trop
 * détaillée pour être embarquée telle quelle : on simplifie chaque anneau
 * (Douglas-Peucker) et on écarte les îlots minuscules, pour un contour lisible à
 * la taille d'un écran de téléphone sans peser sur le bundle.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'data', 'france-map.ts');

// Le « cœur » de chaque région viticole, en degrés décimaux (WGS 84). Un point
// ne résume évidemment pas un vignoble entier : il marque son centre de gravité
// approximatif, choisi sur une ville ou une appellation emblématique.
const REGION_COORDS = {
  alsace: { lat: 48.08, lon: 7.36, ref: 'Colmar' },
  beaujolais: { lat: 46.03, lon: 4.62, ref: 'Villefranche-sur-Saône' },
  bordeaux: { lat: 44.87, lon: -0.46, ref: 'Bordeaux' },
  bourgogne: { lat: 47.02, lon: 4.84, ref: 'Beaune' },
  champagne: { lat: 49.04, lon: 3.96, ref: 'Épernay' },
  corse: { lat: 42.32, lon: 9.15, ref: 'Patrimonio' },
  jura: { lat: 46.9, lon: 5.77, ref: 'Arbois' },
  languedoc: { lat: 43.35, lon: 3.05, ref: 'Béziers — Narbonne' },
  loire: { lat: 47.35, lon: 0.62, ref: 'Tours — Vouvray' },
  lorraine: { lat: 48.68, lon: 5.85, ref: 'Toul' },
  provence: { lat: 43.45, lon: 6.0, ref: 'Côtes de Provence' },
  rhone: { lat: 44.75, lon: 4.83, ref: 'Valence — Tain' },
  savoie: { lat: 45.55, lon: 5.93, ref: 'Chignin — Apremont' },
  sudouest: { lat: 44.0, lon: 0.85, ref: 'Cahors — Gaillac' },
};

// ── Projection ──────────────────────────────────────────────────────────────
// Équirectangulaire calée sur un parallèle de référence : à l'échelle de la
// France, la déformation reste imperceptible et le calcul reste inversible
// trivialement (utile pour placer un point à partir de sa lat/lon).
const LAT0 = 46.6;
const K = Math.cos((LAT0 * Math.PI) / 180);
const project = ([lon, lat]) => [lon * K, -lat];

// ── Simplification (Douglas-Peucker) ────────────────────────────────────────
function perpDist(p, a, b) {
  const [x, y] = p;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(x - a[0], y - a[1]);
  const t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy);
  const c = t < 0 ? a : t > 1 ? b : [a[0] + t * dx, a[1] + t * dy];
  return Math.hypot(x - c[0], y - c[1]);
}

function simplify(points, tol) {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, idx + 1), tol).slice(0, -1),
    ...simplify(points.slice(idx), tol),
  ];
}

const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]);
  }
  return Math.abs(a / 2);
};

// ── Construction ────────────────────────────────────────────────────────────
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const geom = (src.features ? src.features[0] : src).geometry;
const polygons = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];

const TOL = 0.012; // ≈ 1 km : sous la taille d'un pixel à l'écran
const MIN_AREA = 0.004; // écarte les îlots trop petits pour être visibles

// On ne garde que l'anneau extérieur de chaque polygone (les enclaves internes
// ne se lisent pas à cette échelle) et on écarte les îlots minuscules.
let rings = polygons
  .map((poly) => poly[0].map(project))
  .filter((r) => ringArea(r) >= MIN_AREA)
  .map((r) => simplify(r, TOL));

// Cadrage commun à tous les anneaux, pour que la projection des pastilles et
// celle du contour partagent exactement le même repère.
const all = rings.flat();
const minX = Math.min(...all.map((p) => p[0]));
const maxX = Math.max(...all.map((p) => p[0]));
const minY = Math.min(...all.map((p) => p[1]));
const maxY = Math.max(...all.map((p) => p[1]));

const W = 1000;
const scale = W / (maxX - minX);
const H = Math.round((maxY - minY) * scale);
const toView = ([x, y]) => [(x - minX) * scale, (y - minY) * scale];
const r2 = (n) => Math.round(n * 10) / 10;

const paths = rings
  .map((ring) => {
    const pts = ring.map(toView);
    return (
      `M${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join('L')}Z`
    );
  })
  .sort((a, b) => b.length - a.length);

const markers = Object.entries(REGION_COORDS)
  .map(([id, { lat, lon, ref }]) => {
    const [x, y] = toView(project([lon, lat]));
    return { id, x: r2(x), y: r2(y), ref };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const ts = `// GÉNÉRÉ par scripts/build-france-map.mjs — ne pas éditer à la main.
//
// Contour de la France métropolitaine et position projetée des régions
// viticoles. Les coordonnées sont exprimées dans le repère du viewBox ci-dessous.
//
// Source du contour : données IGN (ADMIN-EXPRESS), via le dépôt
// github.com/gregoiredavid/france-geojson — Licence Ouverte / Open Licence.
// Le tracé a été simplifié pour l'affichage mobile ; il n'a aucune valeur légale
// ni cadastrale.

export const FRANCE_VIEWBOX = '0 0 ${W} ${H}';

/** Contours fermés : la métropole d'abord, puis les îles par taille. */
export const FRANCE_PATHS: string[] = [
${paths.map((p) => `  '${p}',`).join('\n')}
];

/** Position de chaque région viticole, projetée depuis ses vraies coordonnées.
 *  \`ref\` indique le lieu qui a servi de repère. */
export const REGION_POINTS: Record<string, { x: number; y: number; ref: string }> = {
${markers.map((m) => `  ${m.id}: { x: ${m.x}, y: ${m.y}, ref: ${JSON.stringify(m.ref)} },`).join('\n')}
};
`;

fs.writeFileSync(OUT, ts);
console.log(`✅ ${path.relative(ROOT, OUT)}`);
console.log(`   viewBox 0 0 ${W} ${H} · ${paths.length} contours · ${(ts.length / 1024).toFixed(1)} Ko`);
console.log(`   points ${markers.length}/14`);
