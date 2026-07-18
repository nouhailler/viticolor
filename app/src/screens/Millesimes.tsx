import { useStore, setState } from '../store';
import { MILLESIMES } from '../data';
import type { Millesime } from '../types';
import { ScreenHeading } from '../components/ui';

const pct = (v: number, min: number, max: number, band: number): string =>
  `${Math.round((0.18 + (0.82 * (v - min)) / (max - min || 1)) * band)}%`;

interface ChartDef {
  titre: string;
  unite: string;
  get: (m: Millesime) => number;
  colr: string;
  legende: boolean;
  meteo: boolean;
}

const CHARTS: ChartDef[] = [
  { titre: 'Notes de dégustation', unite: 'moyenne pro /100', get: (m) => m.note, colr: 'var(--gold)', legende: false, meteo: false },
  { titre: 'Météo', unite: 'soleil & pluie, avril–oct.', get: (m) => m.soleil, colr: 'var(--gold)', legende: true, meteo: true },
  { titre: 'Potentiel de garde', unite: 'années depuis récolte', get: (m) => m.garde, colr: 'var(--hero-c)', legende: false, meteo: false },
];

export function Millesimes() {
  const sel = useStore((s) => s.millHistSel);
  const detail = MILLESIMES[sel];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ScreenHeading title="Historique des millésimes" subtitle="2015 – 2023 · touchez une année pour le détail" />

      {CHARTS.map((ch) => {
        const vals = MILLESIMES.map(ch.get);
        const mn = Math.min(...vals);
        const mx = Math.max(...vals);
        let rn = 0;
        let rx = 0;
        if (ch.meteo) {
          const rv = MILLESIMES.map((m) => m.pluie);
          rn = Math.min(...rv);
          rx = Math.max(...rv);
        }
        return (
          <div key={ch.titre} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
                {ch.titre}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.unite}</div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
              {MILLESIMES.map((m, i) => (
                <button
                  key={m.y}
                  onClick={() => setState({ millHistSel: i })}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', height: '100%', gap: 2 }}
                >
                  <div style={{ height: pct(ch.get(m), mn, mx, ch.meteo ? 58 : 96), background: i === sel ? 'var(--text)' : ch.colr, borderRadius: 1 }} />
                  {ch.meteo && <div style={{ height: pct(m.pluie, rn, rx, 34), background: 'var(--rain)', borderRadius: 1 }} />}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              {MILLESIMES.map((m, i) => (
                <div key={m.y} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: i === sel ? 'var(--gold)' : 'var(--text-muted)', fontWeight: i === sel ? 700 : 400 }}>
                  {String(m.y).slice(2)}
                </div>
              ))}
            </div>
            {ch.legende && (
              <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, background: 'var(--gold)' }} />
                  Ensoleillement (h)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, background: 'var(--rain)' }} />
                  Pluie (mm)
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Détail année sélectionnée */}
      <div style={{ background: 'var(--surface-hollow)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--gold)' }}>{detail.y}</div>
          <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{detail.note}/100</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--gold-light)' }}>
          <div>☀ {detail.soleil} h</div>
          <div>☂ {detail.pluie} mm</div>
          <div>garde {detail.garde} ans</div>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', fontStyle: 'italic' }}>{detail.txt}</div>
      </div>
    </div>
  );
}
