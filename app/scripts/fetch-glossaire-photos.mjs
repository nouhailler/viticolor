#!/usr/bin/env node
/**
 * Cherche puis télécharge les illustrations du glossaire depuis Wikimedia
 * Commons.
 *
 *   node scripts/fetch-glossaire-photos.mjs probe   → 1 candidat par terme, dans un dossier de travail
 *   node scripts/fetch-glossaire-photos.mjs grab <slug> "File:X.jpg"  → retenu, vers public/glossaire/
 *
 * `probe` sert à constituer une planche-contact : la recherche Commons se
 * trompe souvent de sujet (« pigeage » renvoie un outil de télécom), donc rien
 * n'est retenu sans un examen visuel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'glossaire');
const META = path.join(ROOT, 'src', 'data', 'glossaire-media.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'Viticolor/1.0 (https://github.com/nouhailler/viticolor)';

/** terme du glossaire → requête Commons. Seuls les termes réellement
 *  photographiables figurent ici ; les notions abstraites reçoivent un
 *  pictogramme de famille côté application. */
export const QUERIES = {
  Barrique: 'barrique chai vin',
  Bâtonnage: 'batonnage lies vin',
  Botrytis: 'botrytis cinerea grape pourriture noble',
  Bouchonné: 'bouchon liege vin',
  Cep: 'cep de vigne',
  Chai: 'chai barriques vin',
  Clavelin: 'clavelin vin jaune',
  Coulure: 'coulure vigne',
  Dégorgement: 'degorgement champagne',
  Dépôt: 'depot bouteille vin sediment',
  Douelle: 'douelle tonneau',
  Effeuillage: 'effeuillage vigne',
  Égrappage: 'egrappoir vendange',
  Enherbement: 'enherbement vigne',
  Floraison: 'fleur de vigne floraison',
  Foudre: 'foudre tonneau vin',
  Fût: 'fut chene vin',
  'Gelée de printemps': 'gel vigne printemps bougie',
  Gravelle: 'cristaux tartre vin',
  Greffage: 'greffage vigne',
  Jéroboam: 'jeroboam bouteille',
  Lies: 'lies vin fond cuve',
  Magnum: 'magnum bouteille vin',
  Marc: 'marc de raisin pressurage',
  Phylloxéra: 'phylloxera vastatrix vigne',
  Pièce: 'piece bourgogne tonneau 228',
  Pigeage: 'pigeage cuve vin rouge',
  'Porte-greffe': 'porte greffe vigne plant',
  'Pourriture grise': 'pourriture grise raisin botrytis',
  Pressurage: 'pressoir vendange raisin',
  Remuage: 'remuage pupitre champagne',
  Robe: 'verre vin rouge robe couleur',
  Solera: 'solera criadera barriques',
  Soutirage: 'soutirage vin barrique',
  'Sur lattes': 'bouteilles sur lattes cave champagne',
  Tastevin: 'tastevin',
  Tries: 'tri manuel vendange table',
  Tuffeau: 'tuffeau cave troglodyte saumur',
  'Vendange verte': 'vendange verte eclaircissage',
  Véraison: 'veraison raisin',
  'Vin jaune': 'vin jaune jura verre',
  'Vin orange': 'vin orange macere verre',
};

const slug = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const api = async (params) => {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

const strip = (html) => (html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function fileInfo(title, width) {
  const data = await api({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: String(width),
  });
  const page = Object.values(data.query.pages)[0];
  if (!page?.imageinfo) throw new Error(`pas d'image pour ${title}`);
  const ii = page.imageinfo[0];
  const meta = ii.extmetadata ?? {};
  return {
    title,
    thumb: ii.thumburl,
    width: ii.width,
    height: ii.height,
    author: strip(meta.Artist?.value) || 'Auteur inconnu',
    license: strip(meta.LicenseShortName?.value) || 'voir Commons',
  };
}

async function candidates(query, limit = 4) {
  const data = await api({
    action: 'query',
    list: 'search',
    srsearch: `${query} filetype:bitmap`,
    srnamespace: '6',
    srlimit: String(limit),
  });
  const out = [];
  for (const hit of data.query.search) {
    try {
      out.push(await fileInfo(hit.title, 400));
    } catch {
      /* fichier illisible via l'API */
    }
  }
  return out;
}

async function probe(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const index = {};
  for (const [terme, query] of Object.entries(QUERIES)) {
    const cands = await candidates(query);
    index[terme] = [];
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const name = `${slug(terme)}__${i}.jpg`;
      const res = await fetch(c.thumb, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
      index[terme].push({ file: name, ...c });
    }
    console.log(`${terme} → ${index[terme].length} candidat(s)`);
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 2));
}

async function grab(terme, title) {
  const info = await fileInfo(title, 900);
  const res = await fetch(info.thumb, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`téléchargement ${res.status}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = `${slug(terme)}.jpg`;
  fs.writeFileSync(path.join(OUT_DIR, file), Buffer.from(await res.arrayBuffer()));

  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
  meta[terme] = { img: file, credit: `${info.author} · ${info.license}` };
  const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b, 'fr')));
  fs.writeFileSync(META, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`✅ ${terme} ← ${title}\n   ${meta[terme].credit}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'probe') await probe(args[0] ?? path.join(ROOT, '.glossaire-probe'));
else if (cmd === 'grab') await grab(args[0], args.slice(1).join(' '));
else {
  console.error('Usage: fetch-glossaire-photos.mjs probe [dir] | grab <terme> "File:…"');
  process.exit(1);
}
