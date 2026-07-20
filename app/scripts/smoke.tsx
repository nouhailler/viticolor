// Smoke test SSR : rend chaque écran via renderToString et signale toute erreur.
import { renderToString } from 'react-dom/server.browser';
import { App } from '../src/App';
import { setState } from '../src/store';
import { REGIONS, ATLAS } from '../src/data';
import { REGION_POINTS } from '../src/data/france-map';
import type { ScreenId } from '../src/types';

const cases: { screen: ScreenId; extra?: Record<string, unknown> }[] = [
  { screen: 'home' },
  { screen: 'regions', extra: { regionsView: 'carte', carteRegion: null } },
  { screen: 'regions', extra: { regionsView: 'carte', carteRegion: 'bourgogne', carteZoom: 2 } },
  { screen: 'regions', extra: { regionsView: 'liste' } },
  { screen: 'regions', extra: { regionsView: 'cepages', cepOpen: 0 } },
  { screen: 'region', extra: { regionId: 'bordeaux', appOpen: 0 } },
  { screen: 'region', extra: { regionId: 'jura' } },
  { screen: 'carte', extra: { regionId: 'bourgogne', parcelOverlay: 'alt' } },
  { screen: 'scanner', extra: { scanned: false } },
  { screen: 'scanner', extra: { scanned: true, scanAdded: true } },
  { screen: 'cave' },
  { screen: 'degustation' },
  { screen: 'accords' },
  { screen: 'savoir', extra: { quizPicked: 1 } },
  { screen: 'savoir', extra: { quizDone: true, quizScore: 4 } },
  { screen: 'search', extra: { query: 'chablis' } },
  { screen: 'millesimes' },
  { screen: 'collection', extra: { collOpen: 'gc' } },
  { screen: 'vendanges' },
  { screen: 'actus', extra: { actuCat: 'salon' } },
  { screen: 'glossaire', extra: { glossQuery: 'tanin' } },
  { screen: 'routes' },
  { screen: 'cotes', extra: { cotePeriode: 5 } },
  { screen: 'histoire', extra: { histOpen: 0 } },
  { screen: 'aromes', extra: { aromSel: 3 } },
  { screen: 'bouteilles', extra: { wineColor: 'rouge', wineRegionFilter: 'beaujolais' } },
  { screen: 'bouteilles', extra: { wineSel: 'domaine-jean-foillard-cote-du-py-2023' } },
];

let ok = 0;
const failures: string[] = [];

// Onboarding terminé pour tester le rendu complet (bandeau démo inclus)
setState({ obDone: true, demoOn: true });

for (const c of cases) {
  try {
    setState({ screen: c.screen, ...(c.extra ?? {}) });
    const html = renderToString(<App />);
    if (!html || html.length < 50) throw new Error('sortie vide');
    ok++;
  } catch (e) {
    failures.push(`${c.screen} ${JSON.stringify(c.extra ?? {})} → ${(e as Error).message}`);
  }
}

// Test onboarding actif
try {
  setState({ obDone: false, obStep: 0, screen: 'home' });
  renderToString(<App />);
  setState({ obStep: 3 });
  renderToString(<App />);
  ok++;
} catch (e) {
  failures.push(`onboarding → ${(e as Error).message}`);
}

// Complétude des données de carte : une région absente de REGION_POINTS ne
// planterait pas — elle disparaîtrait simplement de la carte de France. On la
// signale ici plutôt que de la laisser manquer en silence.
for (const r of REGIONS) {
  if (!REGION_POINTS[r.id]) {
    failures.push(`carte → région « ${r.id} » sans coordonnées (voir scripts/build-france-map.mjs)`);
  }
  if (!ATLAS[r.id]) {
    failures.push(`atlas → région « ${r.id} » sans entrée dans atlas.json`);
  }
}

console.log(`\nÉcrans rendus sans erreur : ${ok}/${cases.length + 1}`);
if (failures.length) {
  console.error('\nÉCHECS :');
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
} else {
  console.log('✓ Tous les écrans se rendent correctement.\n');
}
