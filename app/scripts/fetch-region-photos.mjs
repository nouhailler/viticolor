#!/usr/bin/env node
/**
 * Récupère les photos de bandeau des fiches région depuis Wikimedia Commons.
 *
 *   node scripts/fetch-region-photos.mjs search "vignoble alsace"   → candidats
 *   node scripts/fetch-region-photos.mjs grab <regionId> "File:X.jpg"  → télécharge + crédit
 *
 * Les fichiers atterrissent dans public/regions/<regionId>.jpg (largeur 1200),
 * et le crédit « Auteur · Licence » est écrit dans regions.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'regions');
const REGIONS = path.join(ROOT, 'src', 'data', 'regions.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'Viticolor/1.0 (https://github.com/nouhailler/viticolor)';

const api = async (params) => {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`API ${res.status} — ${url}`);
  return res.json();
};

/** Métadonnées d'un fichier : URL réduite, auteur, licence. */
async function fileInfo(title, width = 1200) {
  const data = await api({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: String(width),
  });
  const page = Object.values(data.query.pages)[0];
  if (!page?.imageinfo) throw new Error(`Pas d'image pour ${title}`);
  const ii = page.imageinfo[0];
  const meta = ii.extmetadata ?? {};
  const strip = (html) => (html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return {
    title,
    thumb: ii.thumburl,
    width: ii.width,
    height: ii.height,
    author: strip(meta.Artist?.value) || 'Auteur inconnu',
    license: strip(meta.LicenseShortName?.value) || 'voir Commons',
    // Les licences non libres / restrictives sont à écarter.
    free: !/fair use|non-free/i.test(strip(meta.LicenseShortName?.value)),
  };
}

async function search(query, limit = 8) {
  const data = await api({
    action: 'query',
    list: 'search',
    srsearch: `${query} filetype:bitmap`,
    srnamespace: '6',
    srlimit: String(limit),
  });
  for (const hit of data.query.search) {
    try {
      const info = await fileInfo(hit.title, 800);
      if (info.height / info.width > 0.95) continue; // on veut du paysage
      console.log(`${info.title}\n   ${info.width}×${info.height} · ${info.author} · ${info.license}\n   ${info.thumb}`);
    } catch {
      /* fichier illisible via l'API, on passe */
    }
  }
}

async function grab(regionId, title) {
  const info = await fileInfo(title, 1200);
  if (!info.free) throw new Error(`Licence non libre pour ${title} (${info.license})`);
  const res = await fetch(info.thumb, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Téléchargement ${res.status}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = `${regionId}.jpg`;
  fs.writeFileSync(path.join(OUT_DIR, file), Buffer.from(await res.arrayBuffer()));

  const regions = JSON.parse(fs.readFileSync(REGIONS, 'utf8'));
  const region = regions.find((r) => r.id === regionId);
  if (!region) throw new Error(`Région inconnue : ${regionId}`);
  region.img = file;
  region.credit = `${info.author} · ${info.license}`;
  fs.writeFileSync(REGIONS, `${JSON.stringify(regions, null, 2)}\n`);
  console.log(`✅ ${regionId} ← ${title}\n   ${region.credit}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'search') await search(args.join(' '));
else if (cmd === 'grab') await grab(args[0], args.slice(1).join(' '));
else {
  console.error('Usage: fetch-region-photos.mjs search <requête> | grab <regionId> <File:…>');
  process.exit(1);
}
