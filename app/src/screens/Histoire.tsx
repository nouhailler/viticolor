import { useStore, setState } from '../store';
import { HISTOIRE } from '../data';
import { ScreenHeading, GoldAside } from '../components/ui';

export function Histoire() {
  const histOpen = useStore((s) => s.histOpen);
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenHeading title="Histoire & culture" subtitle="Deux mille ans de vin français" />
      {HISTOIRE.map((h, i) => {
        const open = histOpen === i;
        return (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${open ? 'var(--gold-border)' : 'var(--surface-border)'}`,
              borderRadius: 'var(--r-card)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setState((s) => ({ histOpen: s.histOpen === i ? null : i }))}
              style={{ padding: '15px 16px', width: '100%', textAlign: 'left', display: 'block' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
                  {h.epoque}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h.duree}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--gold-light)', marginTop: 4, lineHeight: 1.2 }}>
                {h.titre}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>{h.chapo}</div>
            </button>
            {open && (
              <div style={{ borderTop: '1px solid var(--surface-border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {h.paras.map((p, k) => (
                  <div key={k} style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
                    {p}
                  </div>
                ))}
                <GoldAside>◆ {h.anecdote}</GoldAside>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
