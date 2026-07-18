import { useStore, setState } from '../store';
import { REGIONS, TERROIR } from '../data';

const EXPOS = ['Sud', 'Sud-Est', 'Est', 'Sud-Ouest'];
const LIEUX = ['Clos', 'Les Perrières', 'Bellevue', 'Les Combes', 'La Côte', 'Les Hauts', 'Champ Long', 'La Roche'];
const SPANS: [number, number][] = [[3, 2], [3, 2], [2, 2], [2, 1], [2, 2], [3, 1], [3, 2], [2, 1], [4, 1]];
const SOLC = ['#a8763a', '#c9a44d', '#8a9a5b'];
const EXPC: Record<string, string> = { Sud: '#d4b06a', 'Sud-Est': '#c08b4a', Est: '#8a6f43', 'Sud-Ouest': '#b06a4a' };
const ALTC = ['#b06a4a', '#c9a44d', '#8fae8a'];
const MICC = ['#7a9a9a', '#c0a05a'];

const OVERLAYS: [string, string][] = [
  ['sol', 'Sol'],
  ['expo', 'Exposition'],
  ['alt', 'Altitude'],
  ['micro', 'Microclimat'],
];

export function Carte() {
  const { regionId, parcelOverlay, parcelSel, zoom } = useStore((s) => ({
    regionId: s.regionId,
    parcelOverlay: s.parcelOverlay,
    parcelSel: s.parcelSel,
    zoom: s.zoom,
  }));

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const T = TERROIR[region.id];
  const seed = region.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0);
  const altSpan = T.alt[1] - T.alt[0];

  const parcelles = SPANS.map(([c, r], i) => {
    const app = region.appellations[i % region.appellations.length];
    const si = (i + seed) % 3;
    const ei = (i * 3 + seed) % 4;
    const mi = (i + seed) % T.micro.length;
    const alt = T.alt[0] + Math.round((((i * 37 + seed * 13) % 100) / 100) * (altSpan / 5)) * 5;
    const altT = Math.min(2, Math.floor((alt - T.alt[0]) / (altSpan / 3 || 1)));
    const bg =
      parcelOverlay === 'sol'
        ? SOLC[si]
        : parcelOverlay === 'expo'
          ? EXPC[EXPOS[ei]]
          : parcelOverlay === 'alt'
            ? ALTC[altT]
            : MICC[mi % 2];
    return {
      c,
      r,
      bg,
      short: LIEUX[(i + seed) % 8],
      tag: app.n,
      name: `${app.n} · ${LIEUX[(i + seed) % 8]}`,
      sol: T.sols[si][0],
      sousSol: T.sols[si][1],
      expo: EXPOS[ei],
      alt,
      micro: T.micro[mi],
    };
  });
  const sel = parcelles[parcelSel] ?? parcelles[0];

  const legende =
    parcelOverlay === 'sol'
      ? T.sols.map((s, i) => ({ c: SOLC[i], label: s[0] }))
      : parcelOverlay === 'expo'
        ? EXPOS.map((e) => ({ c: EXPC[e], label: e }))
        : parcelOverlay === 'alt'
          ? [
              { c: ALTC[0], label: `${T.alt[0]} m` },
              { c: ALTC[1], label: 'intermédiaire' },
              { c: ALTC[2], label: `${T.alt[1]} m` },
            ]
          : T.micro.map((m, i) => ({ c: MICC[i % 2], label: m }));

  const rowH = Math.round(36 * zoom);
  const mapW = Math.round(356 * zoom);
  const fsA = Math.round(10 * Math.min(zoom, 1.5));
  const fsB = Math.round(9 * Math.min(zoom, 1.5));
  const zoomLabel = '×' + zoom.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
          Cartographie parcellaire
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginTop: 2 }}>{region.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Pédologie, exposition, altitude, microclimat</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {OVERLAYS.map(([id, label]) => {
            const active = parcelOverlay === id;
            return (
              <button
                key={id}
                onClick={() => setState({ parcelOverlay: id as never })}
                style={{ padding: '5px 11px', borderRadius: 'var(--r-pill)', fontSize: 11, border: '1px solid var(--gold)', color: active ? 'var(--on-gold)' : 'var(--gold)', background: active ? 'var(--gold)' : 'transparent' }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setState((s) => ({ zoom: Math.max(1, s.zoom - 0.25) }))} style={zoomBtn}>−</button>
          <div style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 32, textAlign: 'center' }}>{zoomLabel}</div>
          <button onClick={() => setState((s) => ({ zoom: Math.min(2, s.zoom + 0.25) }))} style={zoomBtn}>+</button>
        </div>
      </div>

      <div className="vc-scroll" style={{ overflow: 'auto', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', background: '#2b0e13', maxHeight: 330 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, padding: 8, gridAutoRows: `${rowH}px`, minWidth: `${mapW}px` }}>
          {parcelles.map((p, i) => (
            <button
              key={i}
              onClick={() => setState({ parcelSel: i })}
              style={{
                gridColumn: `span ${p.c}`,
                gridRow: `span ${p.r}`,
                background: p.bg,
                border: parcelSel === i ? '2px solid var(--text)' : '1px solid rgba(0,0,0,0.3)',
                borderRadius: 'var(--r-card)',
                padding: '6px 7px',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: fsA, color: '#2b1014', fontWeight: 700, lineHeight: 1.2 }}>{p.short}</div>
              <div style={{ fontSize: fsB, color: 'rgba(43,16,20,0.72)', marginTop: 1 }}>{p.tag}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {legende.map((lg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: lg.c }} />
            {lg.label}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: '14px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--gold)' }}>{sel.name}</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 12px', fontSize: 12 }}>
          <K>Sol</K><div style={{ color: 'var(--text)' }}>{sel.sol}</div>
          <K>Sous-sol</K><div style={{ color: 'var(--text)' }}>{sel.sousSol}</div>
          <K>Exposition</K><div style={{ color: 'var(--text)' }}>{sel.expo}</div>
          <K>Altitude</K><div style={{ color: 'var(--text)' }}>{sel.alt} m</div>
          <K>Microclimat</K><div style={{ color: 'var(--text)' }}>{sel.micro}</div>
        </div>
      </div>
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: 10 }}>{children}</div>;
}

const zoomBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid var(--gold-border)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--gold)',
};
