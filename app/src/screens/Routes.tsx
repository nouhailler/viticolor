import { useStore, setState } from '../store';
import { ROUTES } from '../data';
import { ScreenHeading } from '../components/ui';

const HERO_GRAD = 'linear-gradient(135deg, var(--hero-a), var(--hero-b) 60%, var(--hero-c))';

export function Routes() {
  const routeSel = useStore((s) => s.routeSel);
  const r = ROUTES[routeSel];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeading title="Route des vins" subtitle="Itinéraires œnotouristiques" />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ROUTES.map((rt, i) => {
          const active = i === routeSel;
          return (
            <button
              key={rt.nom}
              onClick={() => setState({ routeSel: i })}
              style={{
                fontSize: 13,
                padding: '9px 16px',
                borderRadius: 'var(--r-pill)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--surface-border)'}`,
                color: active ? 'var(--on-gold)' : 'var(--text-3)',
                background: active ? 'var(--gold)' : 'var(--surface-hollow)',
              }}
            >
              {rt.nom}
            </button>
          );
        })}
      </div>

      {/* Bandeau route */}
      <div style={{ background: HERO_GRAD, borderRadius: 'var(--r-card)', padding: '18px 20px', color: '#f6f1e6' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600 }}>{r.titre}</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>{r.sous}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 18, fontSize: 12 }}>
          <div>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.km}</span> km
          </div>
          <div>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.jours}</span>
          </div>
          <div>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.etapes.length}</span> étapes
          </div>
        </div>
      </div>

      {/* Frise verticale */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {r.etapes.map((e, i) => {
          const trait = i < r.etapes.length - 1;
          return (
            <div key={i} style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    color: 'var(--on-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                {trait && <div style={{ width: 2, flex: 1, background: 'var(--surface-border)', margin: '4px 0' }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--gold-light)' }}>
                    {e.lieu}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{e.dist}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.55 }}>{e.txt}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gold)' }}>◆ {e.halte}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
