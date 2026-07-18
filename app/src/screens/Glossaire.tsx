import { useStore, setState } from '../store';
import { GLOSSAIRE } from '../data';
import { normalize } from '../lib/helpers';
import { ScreenHeading, TextField } from '../components/ui';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function Glossaire() {
  const { glossQuery, glossLettre } = useStore((s) => ({
    glossQuery: s.glossQuery,
    glossLettre: s.glossLettre,
  }));

  const q = glossQuery.trim();
  let list = GLOSSAIRE;
  if (q) {
    const nq = normalize(q);
    list = GLOSSAIRE.filter((g) => normalize(g.terme).includes(nq) || normalize(g.def).includes(nq));
  } else if (glossLettre) {
    list = GLOSSAIRE.filter((g) => normalize(g.terme)[0] === glossLettre.toLowerCase());
  }
  const lettres = ALPHABET.filter((ch) => GLOSSAIRE.some((g) => normalize(g.terme)[0] === ch.toLowerCase()));
  const empty = list.length === 0 && GLOSSAIRE.length > 0;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenHeading
        title="Glossaire"
        subtitle={`${GLOSSAIRE.length} termes chargés · base 500+ en version PWA`}
      />
      <TextField
        value={glossQuery}
        onChange={(e) => setState({ glossQuery: e.target.value, glossLettre: null })}
        placeholder="Rechercher un terme (tanins, malo, terroir…)"
        style={{ background: 'var(--surface)', padding: '11px 14px' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {lettres.map((ch) => {
          const active = glossLettre === ch;
          return (
            <button
              key={ch}
              onClick={() => setState((s) => ({ glossLettre: s.glossLettre === ch ? null : ch, glossQuery: '' }))}
              style={{
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                borderRadius: 'var(--r-card)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--surface-border)'}`,
                color: active ? 'var(--on-gold)' : 'var(--text-3)',
                background: active ? 'var(--gold)' : 'var(--surface-hollow)',
              }}
            >
              {ch}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.slice(0, 60).map((g) => (
          <div
            key={g.terme}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              padding: '12px 15px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>
              {g.terme}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.55 }}>{g.def}</div>
          </div>
        ))}
      </div>
      {empty && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
          Aucun terme trouvé.
        </div>
      )}
    </div>
  );
}
