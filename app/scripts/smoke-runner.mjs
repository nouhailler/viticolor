// Harnais de test : monte un DOM minimal (jsdom), bundle le smoke test SSR
// (esbuild) et l'exécute. Rend chaque écran et échoue si l'un d'eux lève.
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'url';
import { rmSync } from 'fs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v);
  },
  removeItem: (k) => {
    delete mem[k];
  },
};

const out = new URL('./_smoke.bundle.mjs', import.meta.url).pathname;
await build({
  entryPoints: [new URL('./smoke.tsx', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  jsx: 'automatic',
  loader: { '.json': 'json' },
  logLevel: 'error',
  banner: { js: "import { createRequire as _cr } from 'module'; const require = _cr(import.meta.url);" },
});

try {
  await import(pathToFileURL(out).href);
} finally {
  rmSync(out, { force: true });
}
