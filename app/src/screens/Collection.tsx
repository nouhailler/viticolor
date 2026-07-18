import { useStore, setState, actions } from '../store';
import { COLLECTION } from '../data';
import { ScreenHeading } from '../components/ui';

export function Collection() {
  const { collChecked, collOpen } = useStore((s) => ({
    collChecked: s.collChecked,
    collOpen: s.collOpen,
  }));

  let done = 0;
  let tot = 0;
  const objectifs = COLLECTION.map((d) => {
    const items = d.items.map((raw) => {
      const [nom, meta] = raw.split('|');
      const key = `${d.id}:${nom}`;
      const on = !!collChecked[key];
      return { nom, meta, on, key };
    });
    const n = items.filter((i) => i.on).length;
    done += n;
    tot += items.length;
    const complete = n === items.length;
    return {
      ...d,
      items,
      n,
      complete,
      countLine: `${n} / ${items.length}${d.total > items.length ? ` · objectif ${d.total}` : ''}`,
      pct: `${Math.round((100 * n) / items.length)}%`,
    };
  });

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ScreenHeading title="Collection" subtitle={`Cochez chaque vin dégusté · ${done} / ${tot} cochés`} />

      {objectifs.map((ob) => {
        const open = collOpen === ob.id;
        return (
          <div
            key={ob.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setState((s) => ({ collOpen: s.collOpen === ob.id ? null : ob.id }))}
              style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 9, width: '100%', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--gold)' }}>
                  {ob.titre}
                </div>
                <div style={{ fontSize: 12.5, color: ob.complete ? 'var(--gold)' : 'var(--text-3)', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {ob.countLine}
                </div>
              </div>
              <div style={{ height: 5, background: 'var(--surface-hollow)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: ob.pct, background: ob.complete ? 'var(--gold)' : 'var(--hero-c)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <div>{ob.sous}</div>
                <div>{open ? '▲ replier' : '▼ voir la liste'}</div>
              </div>
            </button>
            {open && (
              <div className="vc-scroll" style={{ borderTop: '1px solid var(--surface-border)', maxHeight: 340, overflow: 'auto' }}>
                {ob.items.map((it) => (
                  <button
                    key={it.key}
                    onClick={() => actions.toggleColl(it.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 16px',
                      minHeight: 44,
                      borderBottom: '1px solid var(--surface-list)',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 19,
                        height: 19,
                        borderRadius: '50%',
                        border: `1.5px solid ${it.on ? 'var(--gold)' : 'var(--gold-border)'}`,
                        background: it.on ? 'var(--gold)' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: 'var(--on-gold)',
                        fontWeight: 700,
                      }}
                    >
                      {it.on ? '✓' : ''}
                    </span>
                    <span style={{ flex: 1, fontSize: 13.5, color: it.on ? 'var(--gold-light)' : 'var(--text-3)' }}>{it.nom}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{it.meta}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
        Listes représentatives dans ce prototype — les référentiels complets (635 premiers crus, 363 AOC) seront
        chargés dans la version PWA.
      </div>
    </div>
  );
}
