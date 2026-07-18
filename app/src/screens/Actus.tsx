import { useStore, setState } from '../store';
import { ACTUS, ACTU_CATS } from '../data';
import { ScreenHeading, Chip, Card } from '../components/ui';

export function Actus() {
  const actuCat = useStore((s) => s.actuCat);
  const filtres = [['tout', 'Tout'] as const, ...Object.entries(ACTU_CATS).map(([k, v]) => [k, v[0]] as const)];
  const list = ACTUS.filter((a) => actuCat === 'tout' || a.c === actuCat);

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeading title="Actualités" subtitle="Le fil du vignoble français" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filtres.map(([k, label]) => (
          <Chip
            key={k}
            label={label}
            active={actuCat === k}
            inactiveBg="var(--surface-hollow)"
            inactiveColor="var(--text-3)"
            onClick={() => setState({ actuCat: k })}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((a, i) => {
          const [label, color] = ACTU_CATS[a.c];
          return (
            <Card key={i} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color, fontWeight: 700 }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.date}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--gold-light)', marginTop: 5, lineHeight: 1.2 }}>
                {a.titre}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.55 }}>{a.txt}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
