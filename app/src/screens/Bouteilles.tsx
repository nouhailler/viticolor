import { useStore, setState } from '../store';
import { WINES, REGIONS } from '../data';
import { normalize } from '../lib/helpers';
import { ScreenHeading, Chip } from '../components/ui';
import { BottleGlyph } from '../components/BottleGlyph';
import type { Couleur, Wine } from '../types';

const REGION_NAME: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.id, r.name]));

const COULEUR_LABEL: { id: 'tous' | Couleur; label: string }[] = [
  { id: 'tous', label: 'Toutes' },
  { id: 'rouge', label: 'Rouges' },
  { id: 'blanc', label: 'Blancs' },
  { id: 'rosé', label: 'Rosés' },
  { id: 'effervescent', label: 'Bulles' },
  { id: 'liquoreux', label: 'Liquoreux' },
];

export function Bouteilles() {
  const { wineQuery, wineColor, wineRegionFilter, wineSel, userWines } = useStore((s) => ({
    wineQuery: s.wineQuery,
    wineColor: s.wineColor,
    wineRegionFilter: s.wineRegionFilter,
    wineSel: s.wineSel,
    userWines: s.userWines,
  }));

  // Catalogue complet : vins importés en tête, puis le catalogue embarqué.
  const ALL = [...userWines, ...WINES];

  if (wineSel) {
    const wine = ALL.find((w) => w.id === wineSel);
    if (wine) return <Fiche wine={wine} />;
  }

  // Couleurs et régions réellement présentes
  const presentColors = new Set(ALL.map((w) => w.couleur));
  const colorChips = COULEUR_LABEL.filter((c) => c.id === 'tous' || presentColors.has(c.id));
  const regionCounts = new Map<string, number>();
  ALL.forEach((w) => regionCounts.set(w.regionId, (regionCounts.get(w.regionId) ?? 0) + 1));
  const presentRegions = REGIONS.filter((r) => regionCounts.has(r.id));

  const nq = normalize(wineQuery.trim());
  const list = ALL.filter((w) => {
    if (wineColor !== 'tous' && w.couleur !== wineColor) return false;
    if (wineRegionFilter !== 'toutes' && w.regionId !== wineRegionFilter) return false;
    if (nq) {
      const hay = normalize(`${w.domaine} ${w.cuvee ?? ''} ${w.appellation} ${w.cepages ?? ''}`);
      if (!hay.includes(nq)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenHeading
        title="Bouteilles"
        subtitle={`${ALL.length} vins · ${presentRegions.length} régions · recherche par domaine, appellation ou cépage`}
      />

      <input
        value={wineQuery}
        onChange={(e) => setState({ wineQuery: e.target.value })}
        placeholder="Rechercher (Foillard, Morgon, gamay…)"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          padding: '11px 14px',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--r-card)',
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
        }}
      />

      {/* Filtre couleur */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {colorChips.map((c) => (
          <Chip key={c.id} label={c.label} active={wineColor === c.id} onClick={() => setState({ wineColor: c.id })} />
        ))}
      </div>

      {/* Filtre région (défilement horizontal) */}
      <div className="vc-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        <Chip
          label="Toutes régions"
          active={wineRegionFilter === 'toutes'}
          onClick={() => setState({ wineRegionFilter: 'toutes' })}
          inactiveBg="var(--surface-hollow)"
          inactiveColor="var(--text-3)"
        />
        {presentRegions.map((r) => (
          <Chip
            key={r.id}
            label={`${r.name} ${regionCounts.get(r.id)}`}
            active={wineRegionFilter === r.id}
            onClick={() => setState({ wineRegionFilter: r.id })}
            inactiveBg="var(--surface-hollow)"
            inactiveColor="var(--text-3)"
          />
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {list.length} vin{list.length > 1 ? 's' : ''}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((w) => (
          <button
            key={w.id}
            onClick={() => setState({ wineSel: w.id })}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 12,
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              padding: '12px 14px',
              textAlign: 'left',
            }}
          >
            <BottleGlyph couleur={w.couleur} regionId={w.regionId} height={54} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.15 }}>
                  {w.domaine}
                  {w.cuvee ? <span style={{ color: 'var(--gold-light)' }}> · {w.cuvee}</span> : null}
                </div>
                {w.prixMoyen != null && (
                  <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>{w.prixMoyen} €</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {w.appellation} · {REGION_NAME[w.regionId] ?? w.regionId}
                {w.millesime ? ` · ${w.millesime}` : ' · sans millésime'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{w.cepages}</div>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
            Aucune bouteille ne correspond.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fiche bouteille ───
function Fiche({ wine }: { wine: Wine }) {
  const rows: [string, string | null][] = [
    ['Cépages', wine.cepages],
    ['Degré', wine.degre],
    ['Prix moyen', wine.prixMoyen != null ? `${wine.prixMoyen} €` : null],
    ['Température', wine.temperature],
    ['Potentiel de garde', wine.garde],
    ['Région', REGION_NAME[wine.regionId] ?? wine.regionId],
  ];
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        onClick={() => setState({ wineSel: null })}
        style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 'var(--r-pill)', padding: '5px 12px' }}
      >
        ← Toutes les bouteilles
      </button>

      <div style={{ background: 'var(--surface-hollow)', borderRadius: 'var(--r-panel)', padding: 20 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <BottleGlyph couleur={wine.couleur} regionId={wine.regionId} millesime={wine.millesime} height={130} detail />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-light)' }}>
              {wine.appellation}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--gold)', marginTop: 3, lineHeight: 1.12 }}>
              {wine.domaine}
            </div>
            {wine.cuvee && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', color: 'var(--gold-light)' }}>
                {wine.cuvee}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {wine.millesime ? (
                <>
                  Millésime <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{wine.millesime}</span>
                </>
              ) : (
                'Sans millésime'
              )}{' '}
              · {wine.couleur}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {rows.map(([label, value]) =>
            value ? (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ marginTop: 3, fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{value}</div>
              </div>
            ) : null,
          )}
        </div>

        {wine.notes && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notes</div>
            <div style={{ marginTop: 5, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', fontStyle: 'italic' }}>{wine.notes}</div>
          </div>
        )}

        {wine.accords.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accords mets-vins</div>
            <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {wine.accords.map((a, i) => (
                <div key={i} style={{ border: '1px solid var(--gold-border)', color: 'var(--gold-light)', borderRadius: 'var(--r-pill)', padding: '5px 12px', fontSize: 12.5 }}>
                  {a}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
