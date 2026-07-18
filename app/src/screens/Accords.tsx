import { useStore, setState } from '../store';
import { ACCORDS } from '../data';
import { ScreenHeading, Card } from '../components/ui';

export function Accords() {
  const accordOpen = useStore((s) => s.accordOpen);
  return (
    <div style={{ padding: 20 }}>
      <ScreenHeading title="Accords mets & vins" subtitle="Touchez un plat pour la recommandation" />
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ACCORDS.map((ac, i) => {
          const open = accordOpen === i;
          return (
            <Card
              key={i}
              onClick={() => setState((s) => ({ accordOpen: s.accordOpen === i ? -1 : i }))}
              style={{ padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>{ac.plat}</div>
                <div style={{ color: 'var(--gold)', fontSize: 18 }}>{open ? '−' : '+'}</div>
              </div>
              {open && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{ac.vin}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.6 }}>
                    {ac.pourquoi}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
