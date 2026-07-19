import { useStore, setState, actions } from '../store';
import { REGIONS, ATLAS, NEAR_ME, CEPAGES } from '../data';
import { certColor } from '../lib/helpers';
import { ScreenHeading, DotGauge } from '../components/ui';

const VIEW_CHIPS: [string, string][] = [
  ['carte', 'Carte'],
  ['liste', 'Liste'],
  ['cepages', 'Cépages'],
];

export function Regions() {
  const { regionsView, carteRegion } = useStore((s) => ({
    regionsView: s.regionsView,
    carteRegion: s.carteRegion,
  }));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <ScreenHeading title="Les régions viticoles" subtitle={`${REGIONS.length} grandes régions · ♥ pour vos favorites`} />
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 4 }}>
          {VIEW_CHIPS.map(([id, label]) => {
            const active = regionsView === id;
            return (
              <button
                key={id}
                onClick={() => setState({ regionsView: id as never, carteRegion: null, carteInfo: null })}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 11,
                  border: '1px solid var(--gold)',
                  color: active ? 'var(--on-gold)' : 'var(--gold)',
                  background: active ? 'var(--gold)' : 'transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {regionsView === 'carte' && !carteRegion && <CarteFrance />}
      {regionsView === 'carte' && carteRegion && <CarteRegion regionId={carteRegion} />}
      {regionsView === 'liste' && <ListeRegions />}
      {regionsView === 'cepages' && <CepagesView />}
    </div>
  );
}

// ─── Carte de France ───
function CarteFrance() {
  return (
    <>
      <div style={{ marginTop: 16, filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.45))' }}>
        <div
          style={{
            position: 'relative',
            height: 400,
            clipPath: 'polygon(50% 0%, 96% 25%, 96% 75%, 50% 100%, 4% 75%, 4% 25%)',
            background: 'radial-gradient(ellipse at 50% 40%, #55202b, #3a1219 75%)',
          }}
        >
          {REGIONS.map((r) => {
            const [x, y] = ATLAS[r.id].pos;
            return (
              <button
                key={r.id}
                onClick={() => setState({ carteRegion: r.id, carteZoom: 1, carteInfo: null })}
                style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: r.tint, border: '2px solid var(--gold-light)' }} />
                <span style={{ fontSize: 9, color: 'var(--gold-light)', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>{r.name}</span>
              </button>
            );
          })}
          <div style={{ position: 'absolute', left: '61%', top: '49%', transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', background: 'var(--gold)', border: '2px solid var(--text)', animation: 'pulse 2s infinite' }} />
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7d2c3d', border: '1px solid var(--gold-light)' }} />
          région — touchez pour zoomer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--gold)' }} />
          vous
        </div>
      </div>

      {/* Autour de moi */}
      <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
            Autour de moi
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GPS · Beaune, Côte-d'Or</div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {NEAR_ME.map((nm) => {
            const cc = certColor(nm.c);
            return (
              <div key={nm.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', borderRadius: 'var(--r-pill)', padding: '2px 8px', flexShrink: 0, color: cc, border: `1px solid ${cc}` }}>
                  {nm.c}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{nm.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{nm.v}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold)', flexShrink: 0 }}>{nm.km} km</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Carte régionale zoomable ───
function CarteRegion({ regionId }: { regionId: string }) {
  const { carteZoom, carteInfo } = useStore((s) => ({ carteZoom: s.carteZoom, carteInfo: s.carteInfo }));
  const region = REGIONS.find((r) => r.id === regionId)!;
  const cA = ATLAS[regionId];
  const s2 = regionId.split('').reduce((n, c) => n + c.charCodeAt(0), 0);
  const cz = carteZoom;

  const villageMarkers = cA.vil.map((v, i) => ({
    x: 12 + ((i * 53 + s2 * 7) % 72),
    y: 14 + ((i * 41 + s2 * 11) % 66),
    bg: '#8e5a64',
    radius: '50%',
    rot: '0deg',
    label: v,
    showLabel: cz >= 1.25,
    info: `${v} — village viticole · ${region.name}`,
  }));
  const domaineMarkers = cA.dom.map((d, i) => ({
    x: 10 + ((i * 67 + s2 * 13) % 76),
    y: 12 + ((i * 59 + s2 * 5) % 70),
    bg: 'var(--gold)',
    radius: '1px',
    rot: '45deg',
    label: d.n,
    showLabel: cz >= 1.75,
    info: `${d.n} — certifié ${d.c} · ${d.v}`,
  }));
  const markers = [...villageMarkers, ...domaineMarkers];
  const hasUser = regionId === 'bourgogne';

  return (
    <>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold)' }}>{region.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setState((s) => ({ carteZoom: Math.max(1, s.carteZoom - 0.5) }))} style={zoomBtn}>−</button>
          <div style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 32, textAlign: 'center' }}>×{String(cz).replace('.', ',')}</div>
          <button onClick={() => setState((s) => ({ carteZoom: Math.min(2.5, s.carteZoom + 0.5) }))} style={zoomBtn}>+</button>
          <button onClick={() => setState({ carteRegion: null, carteInfo: null })} style={{ marginLeft: 6, fontSize: 12, color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 'var(--r-pill)', padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ✕ France
          </button>
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>Zoomez pour révéler villages puis domaines</div>

      <div className="vc-scroll" style={{ marginTop: 10, overflow: 'auto', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', background: '#2b0e13', maxHeight: 330 }}>
        <div style={{ position: 'relative', width: Math.round(352 * cz), height: Math.round(300 * cz), background: 'radial-gradient(ellipse at 40% 40%, #3f151d, #2b0e13 80%)' }}>
          {markers.map((m, i) => (
            <button
              key={i}
              onClick={() => setState({ carteInfo: m.info })}
              style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            >
              <span style={{ width: 9, height: 9, background: m.bg, border: '1px solid var(--text)', borderRadius: m.radius, transform: `rotate(${m.rot})` }} />
              {m.showLabel && <span style={{ fontSize: 9, color: 'var(--gold-light)', whiteSpace: 'nowrap' }}>{m.label}</span>}
            </button>
          ))}
          {hasUser && (
            <div style={{ position: 'absolute', left: '55%', top: '42%', transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', background: 'var(--gold)', border: '2px solid var(--text)', animation: 'pulse 2s infinite' }} />
          )}
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8e5a64', border: '1px solid var(--text)' }} />
          village
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'var(--gold)', transform: 'rotate(45deg)', border: '1px solid var(--text)' }} />
          domaine certifié Bio / HVE
        </div>
      </div>
      {carteInfo && (
        <div style={{ marginTop: 10, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderLeft: '2px solid var(--gold)', borderRadius: 'var(--r-card)', padding: '10px 14px', fontSize: 13, color: 'var(--text)' }}>
          {carteInfo}
        </div>
      )}
      <button
        onClick={() => actions.go('region', { regionId })}
        style={{ marginTop: 12, width: '100%', textAlign: 'center', border: '1px solid var(--gold)', color: 'var(--gold)', padding: 12, borderRadius: 'var(--r-card)', fontSize: 14 }}
      >
        Fiche complète {region.name} →
      </button>
    </>
  );
}

// ─── Liste des régions ───
function ListeRegions() {
  const favs = useStore((s) => s.favs);
  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {REGIONS.map((r) => {
        const fav = favs.includes(r.id);
        const meta = `${r.aoc} AOC · ${r.ha} ha · ${r.cepages.slice(0, 2).join(', ')}`;
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: '12px 14px' }}>
            <button
              onClick={() => actions.go('region', { regionId: r.id })}
              style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#f6f1e6', background: r.tint }}
            >
              {r.name[0]}
            </button>
            <button onClick={() => actions.go('region', { regionId: r.id })} style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{meta}</div>
            </button>
            <button onClick={() => actions.toggleFav(r.id)} style={{ fontSize: 20, color: fav ? 'var(--gold)' : '#7a4a52', padding: 6 }}>
              {fav ? '♥' : '♡'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Fiches cépages ───
const CEP_CHIPS: [string, string][] = [
  ['tous', 'Tous'],
  ['rouge', 'Rouges'],
  ['blanc', 'Blancs'],
];

function CepagesView() {
  const { cepFilter, cepOpen } = useStore((s) => ({ cepFilter: s.cepFilter, cepOpen: s.cepOpen }));
  const list = CEPAGES.filter((c) => cepFilter === 'tous' || c.couleur.toLowerCase() === cepFilter);

  return (
    <>
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        {CEP_CHIPS.map(([id, label]) => {
          const active = cepFilter === id;
          return (
            <button
              key={id}
              onClick={() => setState({ cepFilter: id as never, cepOpen: -1 })}
              style={{ padding: '5px 14px', borderRadius: 'var(--r-pill)', fontSize: 12, border: '1px solid var(--gold)', color: active ? 'var(--on-gold)' : 'var(--gold)', background: active ? 'var(--gold)' : 'transparent' }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((c, i) => {
          const open = cepOpen === i;
          const sub = `${c.couleur} · ${c.aromes.join(' · ')}`;
          const gauges: [string, number, string][] = [
            ['Acidité', c.acid, ''],
            ['Sucrosité', c.sucre, ''],
            ['Tanins', c.tanins, c.tTxt],
          ];
          return (
            <div key={c.nom} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)' }}>
              <button
                onClick={() => setState((s) => ({ cepOpen: s.cepOpen === i ? -1 : i }))}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', width: '100%', textAlign: 'left' }}
              >
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: c.tint, border: '1px solid var(--text)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>{c.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
                </div>
                <span style={{ color: 'var(--gold)', fontSize: 16, flexShrink: 0 }}>{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: '7px 12px', fontSize: 12 }}>
                    <MetaKey>Origine</MetaKey>
                    <div style={{ color: 'var(--text)' }}>{c.origine}</div>
                    <MetaKey>Histoire</MetaKey>
                    <div style={{ color: 'var(--text-2)', lineHeight: 1.55 }}>{c.hist}</div>
                    <MetaKey>Couleur</MetaKey>
                    <div style={{ color: 'var(--text)' }}>{c.couleur}</div>
                    <MetaKey>Garde</MetaKey>
                    <div style={{ color: 'var(--text)' }}>{c.garde}</div>
                  </div>
                  <div>
                    <MetaKey>Arômes</MetaKey>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.aromes.map((a) => (
                        <div key={a} style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', borderRadius: 'var(--r-pill)', padding: '3px 10px', fontSize: 11 }}>{a}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {gauges.map(([label, v, txt]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 86, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: 10 }}>{label}</div>
                        <DotGauge value={v} />
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{txt}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <MetaKey>Régions françaises</MetaKey>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.reg.map((rf) => (
                        <div key={rf} style={{ border: '1px solid var(--surface-border)', background: 'var(--surface-hollow)', color: 'var(--gold-light)', borderRadius: 'var(--r-pill)', padding: '3px 10px', fontSize: 11 }}>{rf}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function MetaKey({ children }: { children: React.ReactNode }) {
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
