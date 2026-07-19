// Capture les écrans clés de l'app (build de production) pour le README.
//
// Prérequis : Playwright installé (`npm i -D playwright && npx playwright install
// chromium`) et le build servi localement :
//     npm run build && npm run preview -- --port 4173
// puis, dans un autre terminal :
//     npm run screenshots            # → ../docs/screenshots/*.png
//
// Variables : BASE (défaut http://localhost:4173), 1er argument = dossier de sortie.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = resolve(process.argv[2] || resolve(__dir, '../../docs/screenshots'));
mkdirSync(OUT, { recursive: true });

// menu = libellé exact de l'entrée du menu hamburger (null = écran d'accueil).
const SHOTS = [
  { file: 'accueil', menu: null },
  { file: 'regions', menu: 'Régions & carte' },
  { file: 'cepages', menu: 'Cépages' },
  { file: 'scanner', menu: 'Scanner une étiquette' },
  { file: 'cave', menu: 'Ma cave' },
  { file: 'bouteilles', menu: 'Bouteilles' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 400, height: 860 },
  deviceScaleFactor: 2,
  locale: 'fr-FR',
});
// Onboarding franchi + mode démo coupé pour des captures propres.
await ctx.addInitScript(() => {
  localStorage.setItem('viticolor_onboard', 'true');
  localStorage.setItem('viticolor_demo', 'false');
});

const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(700);

for (const s of SHOTS) {
  if (s.menu) {
    await page.click('button[aria-label="Menu"]');
    await page.waitForTimeout(250);
    await page.click(`nav button:has-text(${JSON.stringify(s.menu)})`);
    await page.waitForTimeout(650);
  }
  await page.screenshot({ path: `${OUT}/${s.file}.png` });
  console.log('✓', s.file);
}

await browser.close();
console.log('Captures →', OUT);
