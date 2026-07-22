import { useStore, setState } from '../store';
import { COTES_VINS } from '../data';
import { ScreenHeading } from '../components/ui';

const evoPct = (s: number[], n: number): number => {
  const a = s[s.length - 1 - n];
  const b = s[s.length - 1];
  return Math.round((100 * (b - a)) / a);
};
const fmtEvo = (p: number): string => `${p >= 0 ? '+' : ''}${p} %`;
const evoColor = (p: number): string => (p >= 0 ? 'var(--positive)' : 'var(--negative)');

export function Cotes() {
  const { coteSel, cotePeriode } = useStore((s) => ({ coteSel: s.coteSel, cotePeriode: s.cotePeriode }));
  const v = COTES_VINS[coteSel];
  const nb = cotePeriode === 5 ? 6 : 11;
  const serie = v.serie.slice(-nb);
  const mn = Math.min(...serie);
  const mx = Math.max(...serie);
  const e1 = evoPct(v.serie, 1);
  const e5 = evoPct(v.serie, 5);
  const e10 = evoPct(v.serie, 10);
  const cote = e1 >= 5 ? '▲ En forte hausse' : e1 >= 0 ? '▲ En hausse' : '▼ En repli';

  const periodBtn = (on: boolean): React.CSSProperties => ({
    fontSize: 11,
    padding: '5px 12px',
    borderRadius: 'var(--r-pill)',
    border: `1px solid ${on ? 'var(--gold)' : 'var(--surface-border)'}`,
    color: on ? 'var(--on-gold)' : 'var(--text-3)',
    background: on ? 'var(--gold)' : 'var(--surface)',
  });

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeading title="Cote des vins" subtitle="Estimations marché · ventes aux enchères & cavistes" />

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {COTES_VINS.map((w, i) => {
          const e = evoPct(w.serie, 1);
          const sel = i === coteSel;
          return (
            <button
              key={i}
              onClick={() => setState({ coteSel: i })}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                background: sel ? 'var(--surface)' : 'var(--surface-list)',
                border: `1px solid ${sel ? 'var(--gold-border)' : 'var(--surface-border)'}`,
                borderRadius: 'var(--r-card)',
                padding: '11px 14px',
                textAlign: 'left',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--gold-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {w.nom}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.meta}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                  {w.serie[w.serie.length - 1]} €
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: evoColor(e), whiteSpace: 'nowrap' }}>
                  {fmtEvo(e)} / an
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Détail */}
      <div style={{ background: 'var(--surface-hollow)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--gold)' }}>{v.nom}</div>
          <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, color: evoColor(e1), whiteSpace: 'nowrap' }}>
            {cote}
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <StatBox label="Prix moyen" value={`${serie[serie.length - 1]} €`} color="var(--text)" />
          <StatBox label="5 ans" value={fmtEvo(e5)} color={evoColor(e5)} />
          <StatBox label="10 ans" value={fmtEvo(e10)} color={evoColor(e10)} />
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Évolution du prix (€)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setState({ cotePeriode: 5 })} style={periodBtn(cotePeriode === 5)}>
              5 ans
            </button>
            <button onClick={() => setState({ cotePeriode: 10 })} style={periodBtn(cotePeriode === 10)}>
              10 ans
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', gap: 5, height: 100 }}>
          {serie.map((p, i) => {
            const h = Math.round(100 * (0.15 + (0.85 * (p - mn)) / (mx - mn || 1)));
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ height: `${h}%`, background: i === serie.length - 1 ? 'var(--text)' : 'var(--gold)', borderRadius: 1 }} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 5, display: 'flex', gap: 5 }}>
          {serie.map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--text-muted)' }}>
              '{String(2026 - (nb - 1) + i).slice(2)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-3)' }}>
          <div>{serie[0]} € en {2026 - nb + 1}</div>
          <div>{serie[serie.length - 1]} € aujourd'hui</div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
        Cotes indicatives compilées des ventes aux enchères et prix cavistes.
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '9px 10px' }}>
      <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 15, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
