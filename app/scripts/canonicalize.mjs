// Canonicalise les noms de producteurs : quand un même producteur existe sous
// « X » et « Domaine X », tout est unifié vers « Domaine X ». Recompute les ids.
// Usage : node scripts/canonicalize.mjs
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { wineId } from './ingest-wines.mjs';

const WINES = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/wines.json');

export function canonicalizeDomaines(wines) {
  const base = (n) => n.replace(/^Domaine\s+/i, '');
  const hasDomaineForm = new Set(
    wines.filter((w) => /^Domaine\s+/i.test(w.domaine)).map((w) => base(w.domaine).toLowerCase()),
  );
  const renamed = [];
  for (const w of wines) {
    if (!/^Domaine\s+/i.test(w.domaine) && hasDomaineForm.has(base(w.domaine).toLowerCase())) {
      const before = w.domaine;
      w.domaine = 'Domaine ' + w.domaine;
      const newId = wineId(w);
      renamed.push(`${before} → ${w.domaine}`);
      w.id = newId;
    }
  }
  return renamed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wines = JSON.parse(readFileSync(WINES, 'utf8'));
  const renamed = canonicalizeDomaines(wines);
  // dédup après renommage
  const byId = new Map();
  for (const w of wines) if (!byId.has(w.id)) byId.set(w.id, w);
  writeFileSync(WINES, JSON.stringify([...byId.values()], null, 2) + '\n');
  console.log(`Producteurs canonicalisés : ${renamed.length}`);
  renamed.forEach((r) => console.log('  ' + r));
}
