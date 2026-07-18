import { useStore, setState, actions } from '../store';
import { computeCave, caveBottles } from '../lib/cave';
import { Eyebrow } from '../components/ui';

const FILTERS: [State, string][] = [
  ['tous', 'Tous'],
  ['rouge', 'Rouges'],
  ['blanc', 'Blancs'],
  ['effervescent', 'Bulles'],
];
type State = 'tous' | 'rouge' | 'blanc' | 'effervescent';

export function Cave() {
  const { qtys, caveFilter } = useStore((s) => ({ qtys: s.qtys, caveFilter: s.caveFilter }));
  const { caveStats, caveValue, caveTrend, alerts } = computeCave(qtys);
  const bottles = caveBottles(qtys, caveFilter);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>Ma cave</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{caveStats}</div>
      </div>

      {/* Valorisation */}
      <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Eyebrow size={12}>Valorisation</Eyebrow>
          <div style={{ fontSize: 12, color: 'var(--positive-soft)' }}>{caveTrend}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>
          {caveValue}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Cotes enchères &amp; cavistes spécialisés · actualisé le 17 juillet 2026
        </div>
      </div>

      {/* Pics de maturité */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Eyebrow size={12}>Pics de maturité</Eyebrow>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((al, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderLeft: '2px solid var(--gold)',
                  borderRadius: 'var(--r-card)',
                  padding: '10px 12px',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{al.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{al.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        {FILTERS.map(([id, label]) => {
          const active = caveFilter === id;
          return (
            <button
              key={id}
              onClick={() => setState({ caveFilter: id })}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--r-pill)',
                fontSize: 12,
                border: '1px solid var(--gold)',
                color: active ? 'var(--on-gold)' : 'var(--gold)',
                background: active ? 'var(--gold)' : 'var(--surface)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Bouteilles */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bottles.map((b) => (
          <div
            key={b.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ width: 8, height: 44, borderRadius: 2, flexShrink: 0, background: b.tint }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{b.meta} · apogée {b.apogee}</div>
              <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.cote}</div>
                <div style={{ color: b.deltaColor }}>{b.deltaLabel}</div>
                {b.inWindowFlag && (
                  <div style={{ border: '1px solid #7fa25a', color: 'var(--positive-soft)', borderRadius: 'var(--r-pill)', padding: '1px 8px', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    à point
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => actions.setQty(b.id, b.qty, -1)} style={roundStyle}>−</button>
              <div style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{b.qty}</div>
              <button onClick={() => actions.setQty(b.id, b.qty, 1)} style={roundStyle}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const roundStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid var(--gold-border)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--gold)',
};
