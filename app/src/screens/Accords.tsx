import { useStore, setState } from '../store';
import { ACCORDS } from '../data';
import { ScreenHeading, Card } from '../components/ui';

// Catégories de plats, dans l'ordre d'un repas, pour un tri efficace.
const ACC_CATS: [string, string][] = [
  ['tous', 'Tous'],
  ['apero', 'Apéritif'],
  ['entree', 'Entrée'],
  ['mer', 'Poisson & mer'],
  ['viande', 'Viande'],
  ['vege', 'Végétarien'],
  ['monde', 'Cuisine du monde'],
  ['rapide', 'Pizza & burger'],
  ['fromage', 'Fromage'],
  ['dessert', 'Dessert'],
];

// Libellés complets affichés en étiquette sur chaque carte.
const CAT_LABEL: Record<string, string> = {
  apero: 'Apéritif',
  entree: 'Entrée',
  mer: 'Poisson & fruits de mer',
  viande: 'Viande',
  vege: 'Végétarien',
  monde: 'Cuisine du monde',
  rapide: 'Pizza & burger',
  fromage: 'Fromage',
  dessert: 'Dessert',
};

export function Accords() {
  const { accordOpen, accordCat } = useStore((s) => ({ accordOpen: s.accordOpen, accordCat: s.accordCat }));
  const list = accordCat === 'tous' ? ACCORDS : ACCORDS.filter((a) => a.cat === accordCat);

  return (
    <div style={{ padding: 20 }}>
      <ScreenHeading title="Accords mets & vins" subtitle={`${ACCORDS.length} accords · touchez un plat pour la recommandation`} />

      <div className="vc-scroll" style={{ marginTop: 14, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {ACC_CATS.map(([id, label]) => {
          const active = accordCat === id;
          const count = id === 'tous' ? ACCORDS.length : ACCORDS.filter((a) => a.cat === id).length;
          return (
            <button
              key={id}
              onClick={() => setState({ accordCat: id, accordOpen: -1 })}
              style={{
                whiteSpace: 'nowrap',
                flexShrink: 0,
                padding: '5px 14px',
                borderRadius: 'var(--r-pill)',
                fontSize: 12,
                border: '1px solid var(--gold)',
                color: active ? 'var(--on-gold)' : 'var(--gold)',
                background: active ? 'var(--gold)' : 'transparent',
              }}
            >
              {label} <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((ac, i) => {
          const open = accordOpen === i;
          return (
            <Card
              key={`${ac.plat}-${i}`}
              onClick={() => setState((s) => ({ accordOpen: s.accordOpen === i ? -1 : i }))}
              style={{ padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  {accordCat === 'tous' && (
                    <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
                      {CAT_LABEL[ac.cat] ?? ''}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>{ac.plat}</div>
                </div>
                <div style={{ color: 'var(--gold)', fontSize: 18, flexShrink: 0 }}>{open ? '−' : '+'}</div>
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
