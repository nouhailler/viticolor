import { useEffect, useRef, useState } from 'react';
import { useStore, actions } from '../store';
import { WINES, REGIONS } from '../data';
import { ocrLabel } from '../lib/ocr';
import { matchLabel, type LabelMatch } from '../lib/matchLabel';
import { wineToCaveItem } from '../lib/cave';
import { Eyebrow } from '../components/ui';
import { BottleGlyph } from '../components/BottleGlyph';
import type { Wine } from '../types';

const REGION_NAME = new Map(REGIONS.map((r) => [r.id, r.name]));

interface ScanResult {
  text: string;
  matches: LabelMatch[];
}

export function Scanner() {
  const userWines = useStore((s) => s.userWines);
  const [result, setResult] = useState<ScanResult | null>(null);

  if (result) {
    return <ScanResultView result={result} onRetry={() => setResult(null)} />;
  }
  return <ScanViewfinder all={[...userWines, ...WINES]} onResult={setResult} />;
}

// ─── Viseur caméra ───
function ScanViewfinder({ all, onResult }: { all: Wine[]; onResult: (r: ScanResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setCamReady(true);
        }
      } catch {
        setCamReady(false);
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = (): string | undefined => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')?.drawImage(v, 0, 0);
    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return undefined;
    }
  };

  const doScan = async () => {
    if (busy) return;
    setError(null);
    const frame = capture();
    if (!frame) {
      setError("Caméra indisponible — autorisez l'accès à la caméra puis réessayez.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const text = await ocrLabel(frame, setProgress);
      onResult({ text, matches: matchLabel(all, text) });
    } catch {
      setError("Analyse impossible : le moteur de lecture n'a pas pu se charger (connexion requise au premier scan).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--scan-bg)', minHeight: 0 }}>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Flux caméra */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: camReady ? 1 : 0,
          }}
        />
        {/* Fond rayé de secours (caméra indisponible) */}
        {!camReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(45deg, #241419 0 14px, #1c1114 14px 28px)',
            }}
          />
        )}
        {/* Ligne de scan animée */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            animation: 'scanline 3s ease-in-out infinite',
          }}
        />
        {/* Cadre de visée */}
        <div style={{ position: 'relative', width: '66%', aspectRatio: '3 / 4', borderRadius: 4 }}>
          <Corner style={{ top: 0, left: 0, borderTop: '3px solid var(--gold)', borderLeft: '3px solid var(--gold)' }} />
          <Corner style={{ top: 0, right: 0, borderTop: '3px solid var(--gold)', borderRight: '3px solid var(--gold)' }} />
          <Corner style={{ bottom: 0, left: 0, borderBottom: '3px solid var(--gold)', borderLeft: '3px solid var(--gold)' }} />
          <Corner style={{ bottom: 0, right: 0, borderBottom: '3px solid var(--gold)', borderRight: '3px solid var(--gold)' }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c9b38a',
              fontSize: 13,
              textAlign: 'center',
              padding: 20,
              fontFamily: 'monospace',
            }}
          >
            visez l'étiquette
            <br />
            de la bouteille
          </div>
        </div>
      </div>
      {error && (
        <div style={{ margin: '0 20px', padding: '10px 14px', background: 'var(--surface)', border: '1px solid #7a3a3a', borderRadius: 'var(--r-card)', fontSize: 12.5, color: '#e08a8a' }}>
          {error}
        </div>
      )}
      <div style={{ padding: '16px 20px 24px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={doScan}
          disabled={busy}
          style={{
            background: 'var(--gold)',
            border: '1px solid var(--gold)',
            color: 'var(--on-gold)',
            borderRadius: 'var(--r-pill)',
            padding: '14px 42px',
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            letterSpacing: '1px',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (progress > 0 ? `Lecture… ${progress} %` : 'Analyse…') : "Scanner l'étiquette"}
        </button>
      </div>
    </div>
  );
}

function Corner({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', width: 28, height: 28, ...style }} />;
}

// ─── Résultat du scan ───
function ScanResultView({ result, onRetry }: { result: ScanResult; onRetry: () => void }) {
  const [sel, setSel] = useState(0);
  const [added, setAdded] = useState<string | null>(null);
  const { matches, text } = result;

  if (matches.length === 0) return <NoMatch text={text} onRetry={onRetry} />;

  const top = matches[sel];
  const w = top.wine;
  const rows: [string, string | null][] = [
    ['Cépages', w.cepages || null],
    ['Prix moyen', w.prixMoyen != null ? `${w.prixMoyen} €` : null],
    ['Température', w.temperature],
    ['Garde', w.garde],
  ];

  const addToCave = () => {
    actions.caveAdd(wineToCaveItem(w));
    setAdded(w.id);
  };

  return (
    <div className="vc-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <Eyebrow>{top.score >= 0.75 ? 'Bouteille reconnue' : 'Correspondance probable'}</Eyebrow>
      </div>

      <div style={{ background: 'var(--surface-hollow)', borderRadius: 'var(--r-panel)', padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <BottleGlyph couleur={w.couleur} regionId={w.regionId} millesime={w.millesime} height={120} detail />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-light)' }}>
              {w.appellation}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.15, marginTop: 3 }}>
              {w.domaine}
            </div>
            {w.cuvee && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontStyle: 'italic', color: 'var(--gold-light)' }}>
                {w.cuvee}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {w.millesime ? `Millésime ${w.millesime}` : 'Sans millésime'} · {w.couleur} ·{' '}
              {REGION_NAME.get(w.regionId) ?? w.regionId}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {rows.map(([label, value]) =>
            value ? (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ marginTop: 3, fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{value}</div>
              </div>
            ) : null,
          )}
        </div>

        {w.accords.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accords mets-vins</div>
            <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {w.accords.map((acc, i) => (
                <div key={i} style={{ border: '1px solid var(--gold-border)', color: 'var(--gold-light)', borderRadius: 'var(--r-pill)', padding: '5px 12px', fontSize: 12.5 }}>
                  {acc}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button
            onClick={addToCave}
            disabled={added === w.id}
            style={{ flex: 1, textAlign: 'center', background: 'var(--gold)', color: 'var(--on-gold)', padding: 11, borderRadius: 'var(--r-card)', fontSize: 14, fontWeight: 700, opacity: added === w.id ? 0.75 : 1 }}
          >
            {added === w.id ? '✓ Ajouté à la cave' : 'Ajouter à ma cave'}
          </button>
          <button
            onClick={() => actions.go('bouteilles', { wineSel: w.id })}
            style={{ flex: 1, textAlign: 'center', border: '1px solid var(--gold)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--r-card)', fontSize: 14, background: 'var(--surface)' }}
          >
            Fiche complète →
          </button>
        </div>
      </div>

      {/* Autres candidats */}
      {matches.length > 1 && (
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>Ce n'est pas celle-ci ?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matches.map((m, i) =>
              i === sel ? null : (
                <button
                  key={m.wine.id}
                  onClick={() => setSel(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: '10px 12px', textAlign: 'left' }}
                >
                  <BottleGlyph couleur={m.wine.couleur} regionId={m.wine.regionId} height={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600 }}>
                      {m.wine.domaine}
                      {m.wine.cuvee ? ` · ${m.wine.cuvee}` : ''}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {m.wine.appellation}
                      {m.wine.millesime ? ` · ${m.wine.millesime}` : ''}
                    </div>
                  </div>
                  <span style={{ color: 'var(--gold)', fontSize: 14 }}>›</span>
                </button>
              ),
            )}
          </div>
        </div>
      )}

      <button
        onClick={onRetry}
        style={{ textAlign: 'center', border: '1px solid var(--surface-border)', color: 'var(--text-3)', padding: 11, borderRadius: 'var(--r-card)', fontSize: 14 }}
      >
        Nouveau scan
      </button>
    </div>
  );
}

// ─── Aucune correspondance ───
function NoMatch({ text, onRetry }: { text: string; onRetry: () => void }) {
  const excerpt = text.replace(/\s+/g, ' ').trim().slice(0, 140);
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <Eyebrow>Étiquette non reconnue</Eyebrow>
      </div>
      <div style={{ background: 'var(--surface-hollow)', borderRadius: 'var(--r-panel)', padding: 20, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65 }}>
        Aucun vin du catalogue ne correspond à ce qui a été lu
        {excerpt ? (
          <>
            {' '}
            (texte détecté : <span style={{ fontStyle: 'italic', color: 'var(--text-3)' }}>« {excerpt}… »</span>)
          </>
        ) : (
          " — aucun texte lisible n'a été détecté"
        )}
        . Rapprochez-vous de l'étiquette, dans un endroit bien éclairé, ou cherchez la bouteille manuellement.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onRetry}
          style={{ flex: 1, textAlign: 'center', background: 'var(--gold)', color: 'var(--on-gold)', padding: 12, borderRadius: 'var(--r-card)', fontSize: 14, fontWeight: 700 }}
        >
          Réessayer
        </button>
        <button
          onClick={() => actions.go('bouteilles', { wineSel: null, wineQuery: '' })}
          style={{ flex: 1, textAlign: 'center', border: '1px solid var(--gold)', color: 'var(--gold)', padding: 12, borderRadius: 'var(--r-card)', fontSize: 14 }}
        >
          Recherche manuelle
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Le scanner reconnaît les {`${WINES.length}`} vins du catalogue et vos imports. Pour une bouteille absente,
        ajoutez-la via Paramètres → Importer des vins.
      </div>
    </div>
  );
}
