import { useEffect, useRef, useState } from 'react';
import { useStore, setState } from '../store';
import { SCAN_DEMO } from '../data';
import { recognizeLabel } from '../lib/ocr';
import { Eyebrow } from '../components/ui';
import { PhotoSlot } from '../components/PhotoSlot';

export function Scanner() {
  const { scanned, scanAdded } = useStore((s) => ({ scanned: s.scanned, scanAdded: s.scanAdded }));
  if (scanned) return <ScanFiche added={scanAdded} />;
  return <ScanViewfinder />;
}

// ─── Viseur caméra réelle ───
function ScanViewfinder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [busy, setBusy] = useState(false);

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
        // Permission refusée / pas de caméra : on garde le fond rayé du prototype.
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
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      return undefined;
    }
  };

  const doScan = async () => {
    if (busy) return;
    setBusy(true);
    await recognizeLabel(capture()); // stub OCR → fiche de démo
    setState({ scanned: true, scanAdded: false });
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
      <div style={{ padding: '20px 20px 24px', display: 'flex', justifyContent: 'center' }}>
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
          {busy ? 'Analyse…' : "Scanner l'étiquette"}
        </button>
      </div>
    </div>
  );
}

function Corner({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', width: 28, height: 28, ...style }} />;
}

// ─── Fiche bouteille (après scan) ───
function ScanFiche({ added }: { added: boolean }) {
  const [photo, setPhoto] = useState('');
  const { wine, fiche, accords } = SCAN_DEMO;

  return (
    <div className="vc-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <Eyebrow>Fiche de la bouteille</Eyebrow>
      </div>
      <div style={{ background: 'var(--surface-hollow)', borderRadius: 'var(--r-panel)', padding: 20 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <PhotoSlot value={photo} onChange={setPhoto} width={96} height={150} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.15 }}>
              {wine.domaine}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>{wine.appellation}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              Millésime <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{wine.millesime}</span> · {wine.couleur}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {fiche.map((row, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{row.label}</div>
              <div style={{ marginTop: 3, fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notes</div>
          <div style={{ marginTop: 5, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', fontStyle: 'italic' }}>{wine.note}</div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accords mets-vins</div>
          <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {accords.map((acc, i) => (
              <div key={i} style={{ border: '1px solid var(--gold-border)', color: 'var(--gold-light)', borderRadius: 'var(--r-pill)', padding: '5px 12px', fontSize: 12.5 }}>
                {acc}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button
            onClick={() => setState({ scanAdded: true })}
            style={{ flex: 1, textAlign: 'center', background: 'var(--gold)', color: 'var(--on-gold)', padding: 11, borderRadius: 'var(--r-card)', fontSize: 14, fontWeight: 700 }}
          >
            {added ? '✓ Ajouté à la cave' : 'Ajouter à ma cave'}
          </button>
          <button
            onClick={() => setState({ scanned: false })}
            style={{ flex: 1, textAlign: 'center', border: '1px solid var(--gold)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--r-card)', fontSize: 14, background: 'var(--surface)' }}
          >
            Nouveau scan
          </button>
        </div>
      </div>
    </div>
  );
}
