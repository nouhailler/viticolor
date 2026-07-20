import { useStore, setState, actions } from '../store';
import { REGIONS, ATLAS, MILLESIMES } from '../data';
import { certColor } from '../lib/helpers';
import { ficheTech } from '../lib/ficheTech';
import { Eyebrow } from '../components/ui';

const MILL_CHIPS: [string, string][] = [
  ['note', 'Note'],
  ['soleil', 'Météo'],
  ['garde', 'Garde'],
];

export function RegionFiche() {
  const { regionId, appOpen, millSel, millMetric } = useStore((s) => ({
    regionId: s.regionId,
    appOpen: s.appOpen,
    millSel: s.millSel,
    millMetric: s.millMetric,
  }));

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const AV = ATLAS[region.id];
  const gradient = `linear-gradient(135deg, ${region.tint}, #2b1216)`;

  const encyclo = [
    { titre: 'Histoire', txt: AV.hist },
    { titre: 'Climat', txt: AV.climat },
    { titre: 'Terroir', txt: AV.terr },
  ];

  // Graphique millésimes (métrique commutable)
  const mVal = (m: (typeof MILLESIMES)[number]) =>
    millMetric === 'note' ? m.note : millMetric === 'soleil' ? m.soleil : m.garde;
  const vals = MILLESIMES.map(mVal);
  const mMin = Math.min(...vals);
  const mMax = Math.max(...vals);
  const millDetail = MILLESIMES[millSel];

  return (
    <div>
      {/* Héros — photo du vignoble en fond (si dispo), sinon dégradé */}
      <div style={{ position: 'relative', color: '#f6f1e6', background: gradient, overflow: 'hidden' }}>
        {region.img && (
          <>
            <img
              src={`/regions/${region.img}`}
              alt={`Vignoble · ${region.name}`}
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, rgba(20,8,10,0.28) 0%, rgba(20,8,10,0.62) 55%, rgba(20,8,10,0.88) 100%)`,
              }}
            />
          </>
        )}
        <div style={{ position: 'relative', padding: '26px 20px', paddingTop: region.img ? 120 : 26 }}>
          <Eyebrow size={12}>Région viticole</Eyebrow>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, marginTop: 4 }}>{region.name}</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 22, fontSize: 13 }}>
            <Stat value={region.aoc} label="appellations" />
            <Stat value={region.ha} label="hectares" />
            <Stat value={region.hl} label="M hl / an" />
          </div>
          {region.img && region.credit && (
            <div style={{ marginTop: 12, fontSize: 10, letterSpacing: '0.3px', color: 'rgba(246,241,230,0.62)' }}>
              📷 {region.credit} · Wikimedia Commons
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-2)' }}>{region.desc}</div>

        {/* Encyclo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {encyclo.map((en) => (
            <div key={en.titre}>
              <Eyebrow>{en.titre}</Eyebrow>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>{en.txt}</div>
            </div>
          ))}
        </div>

        {/* Spécialités */}
        <div>
          <Eyebrow>Spécialités</Eyebrow>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AV.spec.map((sp) => (
              <div key={sp} style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', borderRadius: 'var(--r-pill)', padding: '5px 12px', fontSize: 12 }}>{sp}</div>
            ))}
          </div>
        </div>

        {/* Domaines célèbres */}
        <div>
          <Eyebrow>Domaines célèbres</Eyebrow>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column' }}>
            {AV.dom.map((dm) => {
              const cc = certColor(dm.c);
              return (
                <div key={dm.n} style={{ padding: '9px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', borderRadius: 'var(--r-pill)', padding: '2px 8px', flexShrink: 0, color: cc, border: `1px solid ${cc}` }}>{dm.c}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{dm.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', flexShrink: 0 }}>{dm.v}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cépages emblématiques */}
        <div>
          <Eyebrow>Cépages emblématiques</Eyebrow>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {region.cepages.map((c) => (
              <div key={c} style={{ border: '1px solid var(--gold-border)', color: 'var(--gold)', borderRadius: 'var(--r-pill)', padding: '5px 12px', fontSize: 12 }}>{c}</div>
            ))}
          </div>
        </div>

        {/* Millésimes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Eyebrow>Millésimes</Eyebrow>
            <div style={{ display: 'flex', gap: 6 }}>
              {MILL_CHIPS.map(([id, label]) => {
                const active = millMetric === id;
                return (
                  <button
                    key={id}
                    onClick={() => setState({ millMetric: id as never })}
                    style={{ padding: '4px 10px', borderRadius: 'var(--r-pill)', fontSize: 11, border: '1px solid var(--gold)', color: active ? 'var(--on-gold)' : 'var(--gold)', background: active ? 'var(--gold)' : 'transparent' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', gap: 5, height: 110 }}>
            {MILLESIMES.map((m, i) => {
              const p = (mVal(m) - mMin) / (mMax - mMin || 1);
              const h = Math.round(22 + p * 68);
              const bg = p > 0.66 ? 'var(--gold)' : p > 0.33 ? '#a98a52' : '#6b4a2a';
              const selected = millSel === i;
              return (
                <button key={m.y} onClick={() => setState({ millSel: i })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', borderRadius: '2px 2px 0 0', height: h, background: bg, border: `1px solid ${selected ? 'var(--text)' : 'transparent'}` }} />
                  <div style={{ fontSize: 10, color: selected ? 'var(--text)' : 'var(--text-muted)' }}>'{String(m.y).slice(2)}</div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{millDetail.y}</div>
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{millDetail.note}/100</div>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
              <div>☼ {millDetail.soleil} h</div>
              <div>pluie {millDetail.pluie} mm</div>
              <div>garde <span style={{ color: 'var(--text)', fontWeight: 700 }}>{millDetail.garde} ans</span></div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic' }}>{millDetail.txt}</div>
          </div>
        </div>

        {/* Appellations */}
        <div>
          <Eyebrow>Appellations majeures</Eyebrow>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Touchez une appellation pour la fiche technique</div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
            {region.appellations.map((a, i) => {
              const open = appOpen === i;
              const ft = ficheTech(a.t);
              return (
                <button
                  key={a.n}
                  onClick={() => setState((s) => ({ appOpen: s.appOpen === i ? -1 : i }))}
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-border)', textAlign: 'left', display: 'block', width: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                    <div style={{ fontWeight: 700 }}>{a.n}</div>
                    <div style={{ flexShrink: 0, whiteSpace: 'nowrap', color: 'var(--text-3)', fontStyle: 'italic' }}>
                      {a.t} <span style={{ color: 'var(--gold)', fontStyle: 'normal' }}>{open ? '−' : '+'}</span>
                    </div>
                  </div>
                  {open && (
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 12px', fontSize: 12, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: 12 }}>
                      <FtKey>Rendement</FtKey><div style={{ color: 'var(--text)' }}>{ft.rend}</div>
                      <FtKey>Élevage</FtKey><div style={{ color: 'var(--text)' }}>{ft.elev}</div>
                      <FtKey>Levures</FtKey><div style={{ color: 'var(--text)' }}>{ft.lev}</div>
                      <FtKey>Pratiques</FtKey><div style={{ color: 'var(--text)' }}>{ft.prat}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => actions.go('carte', { regionId: region.id })}
            style={{ marginTop: 14, width: '100%', textAlign: 'center', border: '1px solid var(--gold)', color: 'var(--gold)', padding: 12, borderRadius: 'var(--r-card)', fontSize: 14 }}
          >
            Cartographie parcellaire →
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div style={{ color: 'var(--gold)', fontSize: 17, fontWeight: 700 }}>{value}</div>
      <div style={{ opacity: 0.8 }}>{label}</div>
    </div>
  );
}

function FtKey({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: 10 }}>{children}</div>;
}
