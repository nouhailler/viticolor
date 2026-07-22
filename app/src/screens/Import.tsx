import { useState } from 'react';
import { useStore, actions, setState } from '../store';
import { WINES, REGIONS } from '../data';
import { normalize } from '../lib/helpers';
import { ScreenHeading } from '../components/ui';
import type { Couleur, Wine } from '../types';

const COULEURS: Couleur[] = ['rouge', 'blanc', 'rosé', 'effervescent', 'liquoreux'];

// Alias tolérés pour la couleur, ramenés vers les 5 valeurs du schéma.
const COULEUR_ALIAS: Record<string, Couleur> = {
  rouge: 'rouge',
  blanc: 'blanc',
  rose: 'rosé',
  rosé: 'rosé',
  effervescent: 'effervescent',
  bulles: 'effervescent',
  bulle: 'effervescent',
  champagne: 'effervescent',
  cremant: 'effervescent',
  petillant: 'effervescent',
  liquoreux: 'liquoreux',
  moelleux: 'liquoreux',
  doux: 'liquoreux',
};

// index régions : accepte un id ('bordeaux') ou un nom ('Bordeaux', 'Val de Loire').
const REGION_BY_KEY = new Map<string, string>();
REGIONS.forEach((r) => {
  REGION_BY_KEY.set(normalize(r.id), r.id);
  REGION_BY_KEY.set(normalize(r.name), r.id);
});

// Gabarit JSON pré-rempli avec l'exemple fourni : l'utilisateur le copie, l'édite, le colle.
const GABARIT = `{
  "domaine": "Château Montrose",
  "cuvee": null,
  "appellation": "Saint-Estèphe",
  "region": "Bordeaux",
  "couleur": "rouge",
  "millesime": 2016,
  "cepages": "Cabernet Sauvignon 60 %, Merlot 40 %",
  "degre": "13,5 % vol.",
  "prixMoyen": 95,
  "temperature": "16–18 °C",
  "garde": "2024–2045",
  "notes": "cassis, cèdre, tanins fins, longue finale…",
  "accords": []
}`;

// ─── Normalisation d'un objet brut vers un Wine valide ───
type ParseOk = { ok: true; wine: Omit<Wine, 'id'> };
type ParseErr = { ok: false; err: string };

function toStrOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parseMillesime(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().toLowerCase();
  if (s === '' || s.startsWith('non') || s === 'nm' || s === 'sans') return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parsePrix(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function normalizeWine(raw: Record<string, unknown>, i: number): ParseOk | ParseErr {
  const where = `vin n°${i + 1}`;
  const domaine = toStrOrNull(raw.domaine);
  if (!domaine) return { ok: false, err: `${where} : « domaine » manquant.` };

  const appellation = toStrOrNull(raw.appellation);
  if (!appellation) return { ok: false, err: `${where} (${domaine}) : « appellation » manquante.` };

  const regionRaw = toStrOrNull(raw.region) ?? toStrOrNull(raw.regionId);
  if (!regionRaw) return { ok: false, err: `${where} (${domaine}) : « region » manquante.` };
  const regionId = REGION_BY_KEY.get(normalize(regionRaw));
  if (!regionId) {
    return {
      ok: false,
      err: `${where} (${domaine}) : région « ${regionRaw} » inconnue. Régions : ${REGIONS.map((r) => r.name).join(', ')}.`,
    };
  }

  const couleurRaw = toStrOrNull(raw.couleur);
  if (!couleurRaw) return { ok: false, err: `${where} (${domaine}) : « couleur » manquante.` };
  const couleur = COULEUR_ALIAS[normalize(couleurRaw)];
  if (!couleur) {
    return { ok: false, err: `${where} (${domaine}) : couleur « ${couleurRaw} » invalide (${COULEURS.join(' / ')}).` };
  }

  let accords: string[] = [];
  if (Array.isArray(raw.accords)) accords = raw.accords.map((a) => String(a).trim()).filter(Boolean);
  else if (typeof raw.accords === 'string' && raw.accords.trim())
    accords = raw.accords.split(/[,;]/).map((a) => a.trim()).filter(Boolean);

  return {
    ok: true,
    wine: {
      domaine,
      cuvee: toStrOrNull(raw.cuvee),
      appellation,
      regionId,
      couleur,
      millesime: parseMillesime(raw.millesime),
      cepages: toStrOrNull(raw.cepages) ?? '',
      degre: toStrOrNull(raw.degre),
      prixMoyen: parsePrix(raw.prixMoyen),
      temperature: toStrOrNull(raw.temperature),
      garde: toStrOrNull(raw.garde),
      notes: toStrOrNull(raw.notes),
      accords,
    },
  };
}

// slug stable domaine-appellation-millesime, unique dans tout le catalogue.
function makeId(w: Omit<Wine, 'id'>, taken: Set<string>): string {
  const base =
    normalize(`${w.domaine}-${w.appellation}-${w.millesime ?? 'nm'}`)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'vin';
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

// Clé de contenu pour repérer un vin déjà présent (doublon ignoré à l'import).
const contentKey = (w: Pick<Wine, 'domaine' | 'cuvee' | 'appellation' | 'millesime'>): string =>
  normalize(`${w.domaine}|${w.cuvee ?? ''}|${w.appellation}|${w.millesime ?? 'nm'}`);

export function Import() {
  const userWines = useStore((s) => s.userWines);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [added, setAdded] = useState<number | null>(null);
  const [dupes, setDupes] = useState(0);
  const [copied, setCopied] = useState(false);

  const doCopy = () => {
    navigator.clipboard?.writeText(GABARIT).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => setCopied(false),
    );
  };

  const doImport = () => {
    setAdded(null);
    setDupes(0);
    const trimmed = text.trim();
    if (!trimmed) {
      setErrors(['Collez d’abord un objet ou un tableau JSON.']);
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch (e) {
      setErrors([`JSON invalide : ${(e as Error).message}`]);
      return;
    }
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) {
      setErrors(['Aucun vin dans le JSON fourni.']);
      return;
    }

    const errs: string[] = [];
    const taken = new Set<string>([...WINES.map((w) => w.id), ...userWines.map((w) => w.id)]);
    const known = new Set<string>([...WINES, ...userWines].map(contentKey));
    const wines: Wine[] = [];
    let dupeCount = 0;
    rows.forEach((row, i) => {
      if (typeof row !== 'object' || row == null) {
        errs.push(`vin n°${i + 1} : ce n’est pas un objet JSON.`);
        return;
      }
      const res = normalizeWine(row as Record<string, unknown>, i);
      if (!res.ok) {
        errs.push(res.err);
        return;
      }
      const key = contentKey(res.wine);
      if (known.has(key)) {
        // Doublon (même domaine / cuvée / appellation / millésime) : ignoré automatiquement.
        dupeCount++;
        return;
      }
      known.add(key);
      wines.push({ ...res.wine, id: makeId(res.wine, taken) });
    });

    setErrors(errs);
    if (wines.length > 0) actions.importWines(wines);
    if (wines.length > 0 || dupeCount > 0) {
      setAdded(wines.length);
      setDupes(dupeCount);
      setText('');
    }
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenHeading title="Importer un vin" subtitle="Ajoutez vos bouteilles au catalogue via un gabarit JSON" />

      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
        Copiez le gabarit, remplacez les valeurs (un objet <code>{'{ … }'}</code> pour un vin, ou un tableau{' '}
        <code>[ … ]</code> pour plusieurs), puis collez-le ci-dessous. Les vins importés rejoignent l’écran{' '}
        <strong>Bouteilles</strong> et restent enregistrés sur cet appareil.
      </div>

      {/* Gabarit */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
            Gabarit JSON
          </div>
          <button
            onClick={doCopy}
            style={{ fontSize: 12, color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 'var(--r-pill)', padding: '4px 12px' }}
          >
            {copied ? '✓ Copié' : 'Copier'}
          </button>
        </div>
        <pre className="vc-scroll" style={{ margin: 0, padding: '12px 14px', overflowX: 'auto', fontSize: 12, lineHeight: 1.55, color: 'var(--text-2)', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}>
          {GABARIT}
        </pre>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong>Champs requis :</strong> domaine, appellation, region, couleur. Les autres sont facultatifs.{' '}
        <strong>couleur</strong> : {COULEURS.join(' / ')}. <strong>region</strong> : nom ou identifiant{' '}
        ({REGIONS.map((r) => r.name).join(', ')}). <strong>millesime</strong> : année ou « non millésimé ». Les
        doublons (même domaine, cuvée, appellation et millésime) sont ignorés automatiquement.
      </div>

      {/* Zone de collage */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez ici votre JSON…"
        spellCheck={false}
        rows={9}
        style={{
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          fontSize: 12.5,
          padding: '12px 14px',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--r-card)',
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={doImport}
          style={{ flex: 1, textAlign: 'center', background: 'var(--gold)', color: 'var(--on-gold)', fontWeight: 700, padding: 13, borderRadius: 'var(--r-card)', fontSize: 14 }}
        >
          Importer
        </button>
        {text.trim() && (
          <button
            onClick={() => { setText(''); setErrors([]); setAdded(null); }}
            style={{ color: 'var(--gold)', border: '1px solid var(--gold)', padding: '13px 16px', borderRadius: 'var(--r-card)', fontSize: 14 }}
          >
            Effacer
          </button>
        )}
      </div>

      {/* Retours */}
      {added != null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--r-card)', padding: '11px 14px', fontSize: 13, color: 'var(--text)' }}>
          {added > 0 ? `✓ ${added} vin${added > 1 ? 's' : ''} importé${added > 1 ? 's' : ''}. ` : 'Aucun vin importé. '}
          {dupes > 0 && (
            <span style={{ color: 'var(--text-muted)' }}>
              ({dupes} doublon{dupes > 1 ? 's' : ''} déjà au catalogue — ignoré{dupes > 1 ? 's' : ''}.){' '}
            </span>
          )}
          {added > 0 && (
            <button onClick={() => setState({ screen: 'bouteilles', wineSel: null })} style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
              Voir dans Bouteilles →
            </button>
          )}
        </div>
      )}
      {errors.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid #7a3a3a', borderLeft: '3px solid #c26', borderRadius: 'var(--r-card)', padding: '11px 14px', fontSize: 12.5, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontWeight: 700, color: '#e08a8a' }}>{errors.length} problème{errors.length > 1 ? 's' : ''} :</div>
          {errors.map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
        </div>
      )}

      {/* Vins déjà importés */}
      {userWines.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
              Vins importés · {userWines.length}
            </div>
            <button onClick={() => actions.clearUserWines()} style={{ fontSize: 11.5, color: 'var(--text-muted)', textDecoration: 'underline' }}>
              Tout retirer
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userWines.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
                    {w.domaine}{w.cuvee ? ` · ${w.cuvee}` : ''}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                    {w.appellation}{w.millesime ? ` · ${w.millesime}` : ''} · {w.couleur}
                  </div>
                </div>
                <button
                  onClick={() => setState({ wineSel: w.id, screen: 'bouteilles' })}
                  style={{ fontSize: 12, color: 'var(--gold)', flexShrink: 0 }}
                >
                  voir
                </button>
                <button
                  onClick={() => actions.removeUserWine(w.id)}
                  aria-label={`Retirer ${w.domaine}`}
                  style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
