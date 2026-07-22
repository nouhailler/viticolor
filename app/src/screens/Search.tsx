import { useStore, setState, actions } from '../store';
import { REGIONS, CEPAGES_LEXIQUE } from '../data';
import { TextField } from '../components/ui';

interface Result {
  titre: string;
  sous: string;
  type: string;
  go: () => void;
}

export function Search() {
  const { query, caveItems } = useStore((s) => ({ query: s.query, caveItems: s.caveItems }));
  const q = query.toLowerCase();
  let results: Result[] = [];

  if (q.length > 1) {
    REGIONS.forEach((r) => {
      if ((r.name + ' ' + r.cepages.join(' ')).toLowerCase().includes(q))
        results.push({ titre: r.name, sous: r.tagline, type: 'région', go: () => actions.go('region', { regionId: r.id }) });
      r.appellations.forEach((a) => {
        if (a.n.toLowerCase().includes(q))
          results.push({ titre: a.n, sous: `${r.name} · ${a.t}`, type: 'AOC', go: () => actions.go('region', { regionId: r.id }) });
      });
    });
    caveItems.forEach((b) => {
      if (b.name.toLowerCase().includes(q))
        results.push({ titre: b.name, sous: `${b.meta} · en cave`, type: 'cave', go: () => actions.go('cave', { caveSel: b.id }) });
    });
    CEPAGES_LEXIQUE.forEach((c) => {
      if (c.nom.toLowerCase().includes(q))
        results.push({ titre: c.nom, sous: c.desc, type: 'cépage', go: () => actions.go('savoir') });
    });
    results = results.slice(0, 10);
  }

  const count =
    q.length > 1
      ? `${results.length} résultat${results.length > 1 ? 's' : ''}`
      : 'Tapez au moins 2 caractères — essayez « chablis », « syrah », « jura »…';

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TextField
        value={query}
        onChange={(e) => setState({ query: e.target.value })}
        placeholder="Vin, appellation, cépage, région…"
        autoFocus
        style={{ fontSize: 15, padding: '13px 16px', border: '1px solid #b08d3e', background: 'var(--surface)' }}
      />
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{count}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((res, i) => (
          <button
            key={i}
            onClick={res.go}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>{res.titre}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{res.sous}</div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-pill)', padding: '3px 9px', flexShrink: 0 }}>
              {res.type}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
