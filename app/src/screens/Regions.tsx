import { useStore, setState, actions } from '../store';
import { REGIONS, ATLAS, NEAR_ME, CEPAGES } from '../data';
import { FRANCE_VIEWBOX, FRANCE_PATHS, REGION_POINTS } from '../data/france-map';
import { FRANCE_RIVERS } from '../data/france-rivers';
import { certColor } from '../lib/helpers';
import { ScreenHeading, DotGauge } from '../components/ui';
import { REGION_RIVERS } from '../components/SituationMap';

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

const [, , VB_W, VB_H] = FRANCE_VIEWBOX.split(' ').map(Number);

// Côté d'affichage du libellé, pour éviter que les pastilles voisines se
// marchent dessus (Bourgogne/Jura) ou débordent du cadre (Corse).
const LABEL_SIDE: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
  bourgogne: 'left',
  jura: 'right',
  beaujolais: 'left',
  savoie: 'right',
  rhone: 'left',
  provence: 'right',
  alsace: 'right',
  lorraine: 'right',
  champagne: 'top',
  corse: 'left',
};

const LABEL_POS: Record<string, React.CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translate(-50%,-6px)' },
  bottom: { top: '100%', left: '50%', transform: 'translate(-50%,6px)' },
  left: { right: '100%', top: '50%', transform: 'translate(-6px,-50%)' },
  right: { left: '100%', top: '50%', transform: 'translate(6px,-50%)' },
};

// Beaune, le point GPS de démonstration. Ses coordonnées sont à quelques
// kilomètres de celles retenues pour la Bourgogne : superposées telles quelles,
// les deux pastilles se lisaient comme un défaut d'affichage. On décale donc le
// repère vers le sud-est, au prix d'une vingtaine de kilomètres d'imprécision
// sur une position de démonstration.
const ME = { x: REGION_POINTS.bourgogne.x + 26, y: REGION_POINTS.bourgogne.y + 22 };

function CarteFrance() {
  return (
    <>
      <div style={{ marginTop: 16, filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.45))' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: `${VB_W} / ${VB_H}`, borderRadius: 'var(--r-card)', overflow: 'hidden', border: '1px solid var(--gold-border)' }}>
          <svg
            viewBox={FRANCE_VIEWBOX}
            width="100%"
            height="100%"
            style={{ display: 'block', position: 'absolute', inset: 0 }}
            role="img"
            aria-label="Carte des régions viticoles de France"
          >
            <defs>
              {/* Halos de terroir : tache douce dans la teinte de chaque région. */}
              <filter id="fr-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" />
              </filter>
              <clipPath id="fr-clip">
                {FRANCE_PATHS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </clipPath>
            </defs>

            {/* Mer */}
            <rect x={0} y={0} width={VB_W} height={VB_H} fill="#c4d8de" />

            {/* Terres */}
            {FRANCE_PATHS.map((d, i) => (
              <path key={i} d={d} fill="#e9e0cd" stroke="#b7a681" strokeWidth={1.6} strokeLinejoin="round" />
            ))}

            {/* Découpés sur les terres : zones de terroir colorées + fleuves */}
            <g clipPath="url(#fr-clip)">
              {REGIONS.map((r) => {
                const p = REGION_POINTS[r.id];
                if (!p) return null;
                return <circle key={r.id} cx={p.x} cy={p.y} r={50} fill={r.tint} opacity={0.4} filter="url(#fr-soft)" />;
              })}
              {FRANCE_RIVERS.map((rv) => (
                <path key={rv.id} d={rv.d} fill="none" stroke="#8fb5cb" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>

            {/* Trait de côte redessiné net par-dessus les halos */}
            {FRANCE_PATHS.map((d, i) => (
              <path key={`c${i}`} d={d} fill="none" stroke="#a8916a" strokeWidth={1.6} strokeLinejoin="round" />
            ))}
          </svg>

          {REGIONS.map((r) => {
            const p = REGION_POINTS[r.id];
            if (!p) return null;
            const side = LABEL_SIDE[r.id] ?? 'bottom';
            return (
              <button
                key={r.id}
                onClick={() => setState({ carteRegion: r.id, carteZoom: 1, carteInfo: null })}
                aria-label={`${r.name} — voir la carte régionale`}
                style={{
                  position: 'absolute',
                  left: `${(p.x / VB_W) * 100}%`,
                  top: `${(p.y / VB_H) * 100}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 26,
                  height: 26,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: r.tint, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.45)' }} />
                <span
                  style={{
                    position: 'absolute',
                    ...LABEL_POS[side],
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#3f2a2d',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px',
                    background: 'rgba(251,246,236,0.82)',
                    padding: '0 3px',
                    borderRadius: 2,
                    pointerEvents: 'none',
                  }}
                >
                  {r.name}
                </span>
              </button>
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: `${(ME.x / VB_W) * 100}%`,
              top: `${(ME.y / VB_H) * 100}%`,
              transform: 'translate(-50%,-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#c9a227',
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
              animation: 'pulse 2s infinite',
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#8e3b4a', border: '2px solid #fff' }} />
          région — touchez pour zoomer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c9a227', border: '2px solid #fff' }} />
          vous
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 2, borderRadius: 2, background: '#8fb5cb' }} />
          fleuve
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Chaque pastille marque le cœur de la région, pas son périmètre : un vignoble
        s'étend bien au-delà de ce repère.
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

  // Positions décoratives (pas de vraies coordonnées village/domaine dans nos
  // données) resserrées vers le cœur de la région pour rester sur les terres et
  // non dans la mer, sur le fond cartographique.
  const villageMarkers = cA.vil.map((v, i) => ({
    x: 50 + ((12 + ((i * 53 + s2 * 7) % 72)) - 48) * 0.58,
    y: 46 + ((14 + ((i * 41 + s2 * 11) % 66)) - 47) * 0.5,
    bg: '#a2404f',
    border: '#fbf6ec',
    radius: '50%',
    rot: '0deg',
    label: v,
    showLabel: cz >= 1.25,
    info: `${v} — village viticole · ${region.name}`,
  }));
  const domaineMarkers = cA.dom.map((d, i) => ({
    x: 50 + ((10 + ((i * 67 + s2 * 13) % 76)) - 48) * 0.6,
    y: 46 + ((12 + ((i * 59 + s2 * 5) % 70)) - 47) * 0.5,
    bg: '#c9a227',
    border: '#6b4e12',
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

      <div className="vc-scroll" style={{ marginTop: 10, overflow: 'auto', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', background: '#c4d8de', maxHeight: 330 }}>
        <div style={{ position: 'relative', width: Math.round(352 * cz), height: Math.round(300 * cz), background: '#c4d8de' }}>
          <RegionMapBackdrop regionId={regionId} />
          {markers.map((m, i) => (
            <button
              key={i}
              onClick={() => setState({ carteInfo: m.info })}
              style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            >
              <span style={{ width: 10, height: 10, background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: m.radius, transform: `rotate(${m.rot})`, boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />
              {m.showLabel && <span style={{ fontSize: 9, fontWeight: 600, color: '#3f2a2d', whiteSpace: 'nowrap', background: 'rgba(251,246,236,0.82)', padding: '0 3px', borderRadius: 2 }}>{m.label}</span>}
            </button>
          ))}
          {hasUser && (
            <div style={{ position: 'absolute', left: '55%', top: '42%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#c9a227', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.5)', animation: 'pulse 2s infinite' }} />
          )}
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 11, color: 'var(--text-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#a2404f', border: '1.5px solid #fbf6ec' }} />
          village
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, background: '#c9a227', transform: 'rotate(45deg)', border: '1px solid #6b4e12' }} />
          domaine certifié Bio / HVE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 2, borderRadius: 2, background: '#4f8bad' }} />
          fleuve
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

// ─── Fond de carte régional ───
// Vrai fond cartographique (style atlas papier, cohérent avec la fiche région) :
// mer bleutée, terres claires, trait de côte, fleuves et régions voisines
// nommées, cadré sur la zone de la région et zoomable avec elle.
const clampVB = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Fenêtre de recadrage, dans les unités du viewBox. Le rapport 352/300 reproduit
// celui de la zone zoomable, pour que les pastilles (positionnées en %) se
// posent exactement sur la géographie affichée.
const MAP_WIN_W = 236;
const MAP_WIN_H = 201;

function RegionMapBackdrop({ regionId }: { regionId: string }) {
  const p = REGION_POINTS[regionId];
  if (!p) return null;

  const x0 = clampVB(p.x - MAP_WIN_W / 2, 0, VB_W - MAP_WIN_W);
  const y0 = clampVB(p.y - MAP_WIN_H / 2, 0, VB_H - MAP_WIN_H);
  const crop = `${x0} ${y0} ${MAP_WIN_W} ${MAP_WIN_H}`;

  const homeIds = REGION_RIVERS[regionId] ?? [];
  const homeRivers = FRANCE_RIVERS.filter((r) => homeIds.includes(r.id));
  const otherRivers = FRANCE_RIVERS.filter((r) => !homeIds.includes(r.id));

  // Régions voisines visibles dans la fenêtre : elles situent la région.
  const neighbours = REGIONS.filter((r) => {
    if (r.id === regionId) return false;
    const q = REGION_POINTS[r.id];
    return q && q.x >= x0 && q.x <= x0 + MAP_WIN_W && q.y >= y0 && q.y <= y0 + MAP_WIN_H;
  });

  return (
    <svg
      viewBox={crop}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      {/* Mer */}
      <rect x={x0} y={y0} width={MAP_WIN_W} height={MAP_WIN_H} fill="#c4d8de" />

      {/* Terres */}
      {FRANCE_PATHS.map((d, i) => (
        <path key={i} d={d} fill="#e9e0cd" stroke="#b7a681" strokeWidth={1.2} strokeLinejoin="round" />
      ))}

      {/* Fleuves de contexte */}
      {otherRivers.map((r) => (
        <path key={r.id} d={r.d} fill="none" stroke="#9fc0d0" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {/* Fleuve(s) de la région, en évidence */}
      {homeRivers.map((r) => (
        <path key={r.id} d={r.d} fill="none" stroke="#4f8bad" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* Régions voisines */}
      {neighbours.map((r) => {
        const q = REGION_POINTS[r.id]!;
        return (
          <g key={r.id}>
            <circle cx={q.x} cy={q.y} r={2.8} fill="#8a5a2b" opacity={0.7} />
            <text x={q.x} y={q.y - 5} textAnchor="middle" fontSize={9} fill="#6b5330" style={{ fontWeight: 600 }}>
              {r.name}
            </text>
          </g>
        );
      })}

      {/* Repère de la région (halo doux) */}
      <circle cx={p.x} cy={p.y} r={16} fill="none" stroke="#b8860b" strokeWidth={1.6} opacity={0.45} />

      {/* Rose des vents */}
      <g transform={`translate(${x0 + MAP_WIN_W - 20}, ${y0 + 18})`} opacity={0.85}>
        <circle r={9} fill="rgba(255,255,255,0.7)" stroke="#b7a681" strokeWidth={1} />
        <path d="M0 -6.5L2 0L0 6.5L-2 0Z" fill="#8a5a2b" />
        <text x={0} y={-10.5} textAnchor="middle" fontSize={8} fill="#6b5330" style={{ fontWeight: 700 }}>N</text>
      </g>
    </svg>
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
