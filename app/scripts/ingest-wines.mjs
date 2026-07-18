// Ingestion d'un lot de vins (gabarit texte étiqueté) dans src/data/wines.json.
// Usage : node scripts/ingest-wines.mjs <fichier-lot.txt>
//
// Tolère aussi les exports « scrapés » : octets UTF-8 échappés (\C3\A9…),
// annotations [estimé]/[source], « non indiqué », préfixe « AOP », millésimes
// multiples. Normalise, comble la température manquante, déduplique par
// id = slug(domaine + cuvée|appellation + millésime), fusionne, canonicalise
// les producteurs, et imprime un rapport détaillé.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const WINES = resolve(__dir, '../src/data/wines.json');

const REGION_BY_NAME = {
  bordeaux: 'bordeaux', bourgogne: 'bourgogne', champagne: 'champagne',
  'val de loire': 'loire', loire: 'loire',
  'vallee du rhone': 'rhone', rhone: 'rhone',
  alsace: 'alsace', provence: 'provence',
  'languedoc-roussillon': 'languedoc', languedoc: 'languedoc', roussillon: 'languedoc',
  beaujolais: 'beaujolais', jura: 'jura',
  'savoie & bugey': 'savoie', savoie: 'savoie', bugey: 'savoie', 'sud-ouest': 'sudouest',
};
const COULMAP = { rouge: 'rouge', blanc: 'blanc', rose: 'rosé', rosé: 'rosé', effervescent: 'effervescent', liquoreux: 'liquoreux' };
const TEMP_DEFAUT = { rouge: '16–18 °C', blanc: '8–10 °C', rosé: '8–10 °C', effervescent: '6–8 °C', liquoreux: '8–10 °C' };
// Dénominations qui ne sont pas des AOC du Beaujolais (à signaler).
const HORS_BEAUJOLAIS = new Set(
  ['bourgogne', 'cremant de bourgogne', 'pouilly fuisse', 'saint veran', 'viognier', 'pinot', 'pinot gris', 'marselan', 'gamaret', 'comte rhodaniens'].map((s) => s),
);

// Déduction de couleur (cépage prioritaire, puis dénomination).
const GRAPES_ROUGE = ['gamay', 'pinot noir', 'syrah', 'merlot', 'cabernet', 'malbec', 'tannat', 'mondeuse', 'gamaret', 'marselan', 'grenache', 'mourvedre', 'cinsault', 'poulsard', 'trousseau', 'negrette', 'fer servadou'];
const GRAPES_BLANC = ['chardonnay', 'riesling', 'sauvignon', 'chenin', 'viognier', 'pinot gris', 'gewurztraminer', 'aligote', 'marsanne', 'roussanne', 'savagnin', 'melon', 'jacquere', 'altesse', 'manseng', 'clairette', 'rolle', 'vermentino', 'muscat', 'sylvaner', 'pinot blanc', 'mauzac', 'colombard'];
const APP_BLANC = ['chardonnay', 'pouilly fuisse', 'saint veran', 'viognier', 'pinot gris'];
const APP_ROUGE = ['marselan', 'gamaret', 'pinot'];

function deduceCouleur(cepages, appellation, cuvee) {
  const c = cepages ? norm(cepages) : '';
  if (c) {
    if (GRAPES_ROUGE.some((g) => c.includes(g))) return { couleur: 'rouge', why: `cépage ${cepages}` };
    if (GRAPES_BLANC.some((g) => c.includes(g))) return { couleur: 'blanc', why: `cépage ${cepages}` };
  }
  // Sinon, la dénomination (cuvée + appellation) porte souvent le cépage.
  const d = norm(`${cuvee || ''} ${appellation}`);
  if (d.includes('cremant') || d.includes('petillant') || d.includes('effervescent')) return { couleur: 'effervescent', why: `dénomination « ${cuvee || appellation} »` };
  if (GRAPES_BLANC.some((g) => d.includes(g)) || APP_BLANC.some((x) => d.includes(x))) return { couleur: 'blanc', why: `dénomination « ${cuvee || appellation} »` };
  if (GRAPES_ROUGE.some((g) => d.includes(g)) || APP_ROUGE.some((x) => d.includes(x))) return { couleur: 'rouge', why: `dénomination « ${cuvee || appellation} »` };
  return null;
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const wineId = (w) => slug(`${w.domaine} ${w.cuvee || w.appellation} ${w.millesime ?? 'nv'}`);

// Décode les runs d'octets UTF-8 échappés (\C3\A9 → é, \E2\82\AC → €…).
function decodeEscapes(raw) {
  return raw.replace(/(?:\\[0-9A-Fa-f]{2})+/g, (m) => {
    const bytes = m.split('\\').filter(Boolean).map((h) => parseInt(h, 16));
    return Buffer.from(bytes).toString('utf8');
  });
}

const NON_RENSEIGNE = /^non indiqu|^non renseign|^non pr[eé]cis/i;
// Retire les annotations [entre crochets] et détecte « non indiqué ».
function clean(v) {
  if (v == null) return null;
  const s = v.replace(/\s*\[[^\]]*\]/g, '').trim();
  if (!s || NON_RENSEIGNE.test(s)) return null;
  return s;
}

function splitAccords(s) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

export function parseBatch(rawInput) {
  const raw = decodeEscapes(rawInput);
  const issues = [];
  const skipped = [];
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => /(^|\n)\s*Domaine\s*:/i.test(b));
  const wines = [];

  blocks.forEach((block, idx) => {
    const f = {};
    for (const line of block.split('\n')) {
      const i = line.indexOf(':');
      if (i < 0) continue;
      f[norm(line.slice(0, i))] = line.slice(i + 1).trim();
    }
    const comble = [];
    const ref = `#${idx + 1}`;

    let domaine = clean(f['domaine']);
    if (!domaine) { skipped.push(`${ref} — sans domaine exploitable (cuvée « ${f['cuvee'] || '?'} »)`); return; }
    domaine = domaine.replace(/^Champagne\s+/i, ''); // préfixe redondant en Champagne

    let appellation = clean(f['appellation']) || 'Appellation inconnue';
    appellation = appellation.replace(/^AOP\s+/i, '').replace(/^AOC\s+/i, '');
    const cuvee = clean(f['cuvee']);

    const regionId = REGION_BY_NAME[norm(f['region'] || '')];
    if (!regionId) issues.push(`${ref} ${domaine} — région inconnue : « ${f['region']} »`);

    const cepages = clean(f['cepages']);
    const couleurRaw = clean(f['couleur']);
    // « effervescent (rosé) » → on retient la base (effervescent) pour le filtre Bulles
    const couleurKey = couleurRaw ? norm(couleurRaw).replace(/\s*\(.*\)\s*$/, '').trim() : '';
    let couleur = couleurKey ? COULMAP[couleurKey] : null;
    if (couleur && couleurRaw && /\(/.test(couleurRaw)) comble.push(`couleur « ${couleurRaw} » → ${couleur}`);
    if (couleurRaw && !couleur) { issues.push(`${ref} ${domaine} — couleur inconnue : « ${couleurRaw} »`); couleur = couleurRaw; }
    if (!couleur) {
      const guess = deduceCouleur(cepages, appellation, cuvee);
      if (guess) { couleur = guess.couleur; comble.push(`couleur → ${guess.couleur} (${guess.why})`); }
      else issues.push(`${ref} ${domaine} · ${cuvee ?? appellation} — couleur non déductible`);
    }

    // Millésime : « non millésimé »/vide → null ; multi-millésimes → le plus récent
    let millesime = null;
    const milClean = clean(f['millesime']);
    if (milClean && !/non mill/i.test(milClean)) {
      const years = (milClean.match(/\d{4}/g) || []).map(Number);
      if (years.length === 1) millesime = years[0];
      else if (years.length > 1) { millesime = Math.max(...years); comble.push(`millésime multiple (${milClean}) → ${millesime}`); }
    }

    // Prix : gère la virgule décimale (10,95 € → 10.95)
    const prixClean = clean(f['prix moyen']);
    let prixMoyen = null;
    if (prixClean) {
      const n = parseFloat(prixClean.replace(/[^0-9,.]/g, '').replace(',', '.'));
      prixMoyen = Number.isFinite(n) ? n : null;
    }

    let temperature = clean(f['temperature']);
    if (!temperature && couleur && TEMP_DEFAUT[couleur]) { temperature = TEMP_DEFAUT[couleur]; comble.push('température'); }

    // Signalements qualité
    if (regionId === 'beaujolais' && HORS_BEAUJOLAIS.has(norm(appellation))) {
      issues.push(`${ref} ${domaine} — appellation atypique pour le Beaujolais : « ${appellation} »`);
    }

    const w = {
      id: '', domaine, cuvee, appellation, regionId: regionId || 'inconnu',
      couleur: couleur || 'non précisé', millesime,
      cepages,
      degre: clean(f['degre']),
      prixMoyen,
      temperature,
      garde: clean(f['garde']),
      notes: clean(f['notes']),
      accords: (() => { const a = clean(f['accords']); return a ? splitAccords(a) : []; })(),
      comble,
    };
    w.id = wineId(w);
    wines.push(w);
  });

  return { wines, issues, skipped };
}

// canonicalise « X » → « Domaine X » quand les deux formes coexistent
function canonicalizeDomaines(wines) {
  const base = (n) => n.replace(/^Domaine\s+/i, '');
  const hasDomaine = new Set(wines.filter((w) => /^Domaine\s+/i.test(w.domaine)).map((w) => base(w.domaine).toLowerCase()));
  let n = 0;
  for (const w of wines) {
    if (!/^Domaine\s+/i.test(w.domaine) && hasDomaine.has(base(w.domaine).toLowerCase())) {
      w.domaine = 'Domaine ' + w.domaine;
      w.id = wineId(w);
      n++;
    }
  }
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) { console.error('Usage : node scripts/ingest-wines.mjs <fichier-lot.txt>'); process.exit(1); }
  const { wines, issues, skipped } = parseBatch(readFileSync(file, 'utf8'));
  const existing = JSON.parse(readFileSync(WINES, 'utf8'));
  const byId = new Map(existing.map((w) => [w.id, w]));
  let added = 0, dup = 0;
  const combles = [];
  const dupList = [];
  for (const w of wines) {
    if (byId.has(w.id)) { dup++; dupList.push(w.id); }
    else { byId.set(w.id, w); added++; if (w.comble.length) combles.push(`${w.domaine} ${w.cuvee ?? ''} → ${w.comble.join(', ')}`); }
  }
  const merged = [...byId.values()];
  const canon = canonicalizeDomaines(merged);
  // dédup post-canonicalisation
  const finalById = new Map();
  for (const w of merged) if (!finalById.has(w.id)) finalById.set(w.id, w);
  writeFileSync(WINES, JSON.stringify([...finalById.values()], null, 2) + '\n');

  console.log(`Blocs valides : ${wines.length} | ajoutés : ${added} | doublons : ${dup} | ignorés : ${skipped.length} | total catalogue : ${finalById.size}`);
  const parCoul = {};
  wines.forEach((w) => (parCoul[w.couleur] = (parCoul[w.couleur] || 0) + 1));
  console.log('Par couleur :', JSON.stringify(parCoul));
  if (canon) console.log(`Producteurs canonicalisés : ${canon}`);
  console.log(`\nChamps comblés : ${combles.length}`);
  combles.slice(0, 40).forEach((c) => console.log('  ~ ' + c));
  console.log(`\nIgnorés (sans domaine) : ${skipped.length}`);
  skipped.forEach((s) => console.log('  ✗ ' + s));
  console.log(`\nDoublons ignorés : ${dup}`);
  dupList.forEach((d) => console.log('  = ' + d));
  console.log(`\nÀ vérifier : ${issues.length}`);
  issues.forEach((x) => console.log('  - ' + x));
}
