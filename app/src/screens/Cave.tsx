import { useState } from 'react';
import { useStore, setState, actions } from '../store';
import { WINES } from '../data';
import { computeCave, caveBottles, wineToCaveItem } from '../lib/cave';
import { normalize } from '../lib/helpers';
import { Eyebrow } from '../components/ui';
import { BottleGlyph } from '../components/BottleGlyph';
import type { CaveItem, Couleur } from '../types';

// Pour les bouteilles sans lien catalogue (démo), on devine la région depuis
// le libellé pour donner la bonne silhouette à la vignette.
const REGION_HINTS: [RegExp, string][] = [
  [/bourgogne|meursault|chambolle|gevrey/i, 'bourgogne'],
  [/alsace|riesling/i, 'alsace'],
  [/rh[oô]ne|cornas|hermitage|c[oô]te-r[oô]tie/i, 'rhone'],
  [/saumur|loire|vouvray|chinon/i, 'loire'],
  [/champagne|ambonnay/i, 'champagne'],
  [/sauternes|julien|pauillac|margaux|pomerol|bordeaux|est[eè]phe/i, 'bordeaux'],
];

function glyphProps(b: CaveItem, wineById: Map<string, { couleur: Couleur; regionId: string }>) {
  const w = b.wineId ? wineById.get(b.wineId) : undefined;
  if (w) return { couleur: w.couleur, regionId: w.regionId };
  const hint = REGION_HINTS.find(([re]) => re.test(`${b.name} ${b.meta}`));
  return { couleur: b.color as Couleur, regionId: hint?.[1] };
}

type Filter = 'tous' | 'rouge' | 'blanc' | 'rosé' | 'effervescent';
const FILTERS: [Filter, string][] = [
  ['tous', 'Tous'],
  ['rouge', 'Rouges'],
  ['blanc', 'Blancs'],
  ['rosé', 'Rosés'],
  ['effervescent', 'Bulles'],
];

export function Cave() {
  const { caveItems, caveFilter, caveSel, userWines } = useStore((s) => ({
    caveItems: s.caveItems,
    caveFilter: s.caveFilter,
    caveSel: s.caveSel,
    userWines: s.userWines,
  }));
  const [adding, setAdding] = useState(false);
  const [pickQuery, setPickQuery] = useState('');

  const wineById = new Map([...userWines, ...WINES].map((w) => [w.id, { couleur: w.couleur, regionId: w.regionId }]));

  // Fiche d'une bouteille ouverte
  if (caveSel) {
    const bottle = caveItems.find((b) => b.id === caveSel);
    // key : réinitialise le champ prix quand on change de bouteille.
    if (bottle) return <FicheCave key={bottle.id} bottle={bottle} glyph={glyphProps(bottle, wineById)} />;
  }

  // Choix d'un vin du catalogue à ajouter
  if (adding) {
    return (
      <AddPicker
        query={pickQuery}
        setQuery={setPickQuery}
        inCave={new Set(caveItems.map((b) => b.wineId).filter(Boolean) as string[])}
        userWines={userWines}
        onClose={() => setAdding(false)}
      />
    );
  }

  const { caveStats, caveValue, caveTrend, trendPct, alerts } = computeCave(caveItems);
  const bottles = caveBottles(caveItems, caveFilter);
  const presentColors = new Set(caveItems.map((b) => b.color));
  const filters = FILTERS.filter(([id]) => id === 'tous' || presentColors.has(id));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>Ma cave</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{caveStats}</div>
      </div>

      {/* Valorisation */}
      <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Eyebrow size={12}>Valorisation</Eyebrow>
          <div style={{ fontSize: 12, color: trendPct >= 0 ? 'var(--positive-soft)' : 'var(--negative-soft)' }}>{caveTrend}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>
          {caveValue}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Prix indicatifs, modifiables dans la fiche de chaque bouteille
        </div>
      </div>

      {/* Pics de maturité */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Eyebrow size={12}>Pics de maturité</Eyebrow>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((al) => (
              <button
                key={al.id}
                onClick={() => setState({ caveSel: al.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderLeft: '2px solid var(--gold)',
                  borderRadius: 'var(--r-card)',
                  padding: '10px 12px',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{al.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{al.msg}</div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--gold)', flexShrink: 0 }}>›</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtres + ajout */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {filters.map(([id, label]) => {
          const active = caveFilter === id;
          return (
            <button
              key={id}
              onClick={() => setState({ caveFilter: id })}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--r-pill)',
                fontSize: 12,
                border: '1px solid var(--gold)',
                color: active ? 'var(--on-gold)' : 'var(--gold)',
                background: active ? 'var(--gold)' : 'var(--surface)',
              }}
            >
              {label}
            </button>
          );
        })}
        <button
          onClick={() => { setPickQuery(''); setAdding(true); }}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: 'var(--r-pill)',
            fontSize: 12,
            fontWeight: 700,
            background: 'var(--gold)',
            color: 'var(--on-gold)',
          }}
        >
          + Ajouter un vin
        </button>
      </div>

      {/* Bouteilles */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bottles.map((b) => (
          <div
            key={b.id}
            onClick={() => setState({ caveSel: b.id })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setState({ caveSel: b.id }); }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <BottleGlyph {...glyphProps(b, wineById)} height={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{b.meta} · apogée {b.apogee}</div>
              <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.cote}</div>
                <div style={{ color: b.deltaColor }}>{b.deltaLabel}</div>
                {b.inWindowFlag && (
                  <div style={{ border: '1px solid #7fa25a', color: 'var(--positive-soft)', borderRadius: 'var(--r-pill)', padding: '1px 8px', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    à point
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => actions.caveQty(b.id, -1)} style={roundStyle} aria-label={`Une bouteille de moins de ${b.name}`}>−</button>
              <div style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{b.qty}</div>
              <button onClick={() => actions.caveQty(b.id, 1)} style={roundStyle} aria-label={`Une bouteille de plus de ${b.name}`}>+</button>
            </div>
          </div>
        ))}
        {bottles.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
            {caveItems.length === 0
              ? 'Votre cave est vide — ajoutez un vin depuis le catalogue.'
              : 'Aucune bouteille pour ce filtre.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fiche bouteille de cave ───
interface GlyphInfo {
  couleur: Couleur;
  regionId?: string;
}
function FicheCave({ bottle: b, glyph }: { bottle: CaveItem; glyph: GlyphInfo }) {
  const [prix, setPrix] = useState(String(b.prix));

  const commitPrix = () => {
    const n = Math.max(0, Math.round(parseFloat(prix.replace(',', '.')) || 0));
    setPrix(String(n));
    if (n !== b.prix) actions.caveSetPrice(b.id, n);
  };

  const remove = () => {
    if (window.confirm(`Retirer « ${b.name} » de la cave ?`)) actions.caveRemove(b.id);
  };

  const YEAR = 2026;
  const hasWindow = b.from > 0 && b.to > b.from;
  // Position de l'année courante sur la fenêtre de garde (bornée 0–100 %).
  const pos = hasWindow ? Math.min(100, Math.max(0, ((YEAR - b.from) / (b.to - b.from)) * 100)) : 0;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        onClick={() => setState({ caveSel: null })}
        style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 'var(--r-pill)', padding: '5px 12px' }}
      >
        ← Ma cave
      </button>

      <div style={{ background: 'var(--surface-hollow)', borderRadius: 'var(--r-panel)', padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <BottleGlyph couleur={glyph.couleur} regionId={glyph.regionId} height={96} detail />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.15 }}>
              {b.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{b.meta}</div>
          </div>
        </div>

        {/* Fenêtre de garde */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Apogée · {b.apogee}
          </div>
          {hasWindow ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--surface-border)' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${pos}%`, borderRadius: 3, background: 'var(--gold)' }} />
                <div
                  style={{
                    position: 'absolute',
                    left: `${pos}%`,
                    top: -4,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    border: '2px solid var(--surface-hollow)',
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                <span>{b.from}</span>
                <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{YEAR}</span>
                <span>{b.to}</span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--text-3)' }}>Fenêtre de garde non renseignée.</div>
          )}
        </div>

        {/* Quantité & prix */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quantité</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => actions.caveQty(b.id, -1)} style={roundStyle} aria-label="Une bouteille de moins">−</button>
              <div style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{b.qty}</div>
              <button onClick={() => actions.caveQty(b.id, 1)} style={roundStyle} aria-label="Une bouteille de plus">+</button>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Prix unitaire</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                onBlur={commitPrix}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                inputMode="numeric"
                aria-label="Prix unitaire en euros"
                style={{
                  width: 70,
                  fontSize: 16,
                  fontWeight: 700,
                  padding: '4px 8px',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--r-card)',
                  background: 'var(--surface-hollow)',
                  color: 'var(--gold)',
                  outline: 'none',
                }}
              />
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>€</span>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Valeur ligne</div>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{b.qty * b.prix} €</div>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cote 12 mois</div>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: b.delta >= 0 ? 'var(--positive-soft)' : 'var(--negative-soft)' }}>
              {b.delta === 0 ? 'stable' : `${b.delta > 0 ? '+' : ''}${b.delta} %`}
            </div>
          </div>
        </div>
      </div>

      {b.wineId && (
        <button
          onClick={() => actions.go('bouteilles', { wineSel: b.wineId })}
          style={{ textAlign: 'center', border: '1px solid var(--gold)', color: 'var(--gold)', padding: 12, borderRadius: 'var(--r-card)', fontSize: 13.5, fontWeight: 700 }}
        >
          Voir la fiche du catalogue →
        </button>
      )}

      <button
        onClick={remove}
        style={{ textAlign: 'center', border: '1px solid #7a3a3a', color: '#e08a8a', padding: 12, borderRadius: 'var(--r-card)', fontSize: 13.5 }}
      >
        Retirer de la cave
      </button>
    </div>
  );
}

// ─── Choix d'un vin du catalogue ───
interface AddPickerProps {
  query: string;
  setQuery: (q: string) => void;
  inCave: Set<string>;
  userWines: typeof WINES;
  onClose: () => void;
}
function AddPicker({ query, setQuery, inCave, userWines, onClose }: AddPickerProps) {
  const ALL = [...userWines, ...WINES];
  const nq = normalize(query.trim());
  const list = (nq
    ? ALL.filter((w) => normalize(`${w.domaine} ${w.cuvee ?? ''} ${w.appellation} ${w.cepages ?? ''}`).includes(nq))
    : ALL
  ).slice(0, 30);

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        onClick={onClose}
        style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 'var(--r-pill)', padding: '5px 12px' }}
      >
        ← Ma cave
      </button>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600 }}>Ajouter un vin à la cave</div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Rechercher parmi ${ALL.length} vins…`}
        autoFocus
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((w) => {
          const already = inCave.has(w.id);
          return (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--r-card)',
                padding: '11px 14px',
              }}
            >
              <BottleGlyph couleur={w.couleur} regionId={w.regionId} height={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
                  {w.domaine}
                  {w.cuvee ? <span style={{ color: 'var(--gold-light)' }}> · {w.cuvee}</span> : null}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                  {w.appellation}
                  {w.millesime ? ` · ${w.millesime}` : ''} · {w.couleur}
                  {w.prixMoyen != null ? ` · ${w.prixMoyen} €` : ''}
                </div>
              </div>
              <button
                onClick={() => actions.caveAdd(wineToCaveItem(w))}
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid var(--gold)',
                  color: already ? 'var(--gold)' : 'var(--on-gold)',
                  background: already ? 'transparent' : 'var(--gold)',
                }}
              >
                {already ? '+1 en cave' : '+ Ajouter'}
              </button>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
            Aucun vin ne correspond.
          </div>
        )}
        {!nq && ALL.length > 30 && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center' }}>
            30 premiers vins affichés — précisez votre recherche.
          </div>
        )}
      </div>
    </div>
  );
}

const roundStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid var(--gold-border)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--gold)',
};
