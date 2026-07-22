import { useStore, actions } from '../store';
import {
  REGIONS,
  CEPAGES,
  ACCORDS,
  WINES,
  DECOUVERTE_DOMAINES,
  DECOUVERTE_ANECDOTES,
} from '../data';
import { duJour, dateLongue, normalize } from '../lib/helpers';
import { computeCave } from '../lib/cave';
import { Eyebrow, Card } from '../components/ui';
import { BottleGlyph } from '../components/BottleGlyph';
import { CepageGlyph } from '../components/CepageGlyph';
import type { Wine } from '../types';

const HERO_GRAD = 'linear-gradient(135deg, var(--hero-a), var(--hero-b) 60%, var(--hero-c))';

// ─── Rapprochement Découverte du jour → catalogue ───
// Les libellés de découverte sont éditoriaux (« Clos Rougeard “Les Poyeux” ») :
// on les rapproche du catalogue par recouvrement de mots significatifs, pour
// ouvrir la bonne fiche quand elle existe, ou une recherche pré-remplie sinon.
const clean = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set(['domaine', 'chateau', 'clos', 'les', 'la', 'le', 'de', 'du', 'des']);
const tokensOf = (s: string) => clean(s).split(' ').filter((t) => t.length > 2 && !STOP.has(t));
const score = (tokens: string[], hay: string) =>
  tokens.filter((t) => hay.includes(t)).length / Math.max(1, tokens.length);

/** Ouvre la fiche du vin le plus proche du libellé, sinon la liste du domaine
 *  correspondant, sinon Bouteilles avec la recherche pré-remplie. */
function openInBouteilles(all: Wine[], libelle: string) {
  const toks = tokensOf(libelle);
  let best: Wine | null = null;
  let bestScore = 0;
  for (const w of all) {
    const s = score(toks, clean(`${w.domaine} ${w.cuvee ?? ''} ${w.appellation}`));
    if (s > bestScore) { best = w; bestScore = s; }
  }
  const reset = { wineSel: null, wineColor: 'tous', wineRegionFilter: 'toutes' } as const;
  if (best && bestScore >= 0.75) {
    // Libellé qui ne désigne que le domaine (pas une cuvée précise) alors que
    // celui-ci a plusieurs vins : on montre la liste plutôt qu'une fiche arbitraire.
    const sameDomaine = all.filter((w) => clean(w.domaine) === clean(best!.domaine));
    if (sameDomaine.length > 1 && score(toks, clean(best.domaine)) >= 0.75) {
      actions.go('bouteilles', { ...reset, wineQuery: best.domaine });
    } else {
      actions.go('bouteilles', { ...reset, wineSel: best.id });
    }
    return;
  }
  // À défaut de fiche exacte : tous les vins du domaine reconnu par un mot distinctif.
  const dom = all.find((w) => {
    const c = clean(w.domaine);
    return toks.some((t) => t.length >= 5 && c.includes(t));
  });
  actions.go('bouteilles', {
    ...reset,
    wineQuery: dom ? dom.domaine : libelle.split(/[«,(]/)[0].trim(),
  });
}

export function Home() {
  const { notes, caveItems, userWines } = useStore((s) => ({
    notes: s.notes,
    caveItems: s.caveItems,
    userWines: s.userWines,
  }));
  const ALL = [...userWines, ...WINES];
  const featured = duJour(REGIONS);
  const cepage = duJour(CEPAGES);
  // La bouteille du jour est tirée du vrai catalogue (et non d'une liste
  // éditoriale figée) : le clic ouvre toujours une fiche qui existe.
  const bouteille = duJour(ALL);
  const domaine = duJour(DECOUVERTE_DOMAINES);
  const anecdote = duJour(DECOUVERTE_ANECDOTES);
  const { alerts } = computeCave(caveItems);
  const lastNote = notes[0];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Héros */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'var(--text)',
          }}
        >
          Le vignoble français,
          <br />
          <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>en poche.</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-3)' }}>
          363 appellations · 750 000 ha · 66 M hl par an
        </div>
      </div>

      {/* Faux champ de recherche */}
      <div
        onClick={() => actions.go('search')}
        style={{
          cursor: 'text',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--r-card)',
          padding: '12px 16px',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Rechercher un vin, une appellation, un cépage…
      </div>

      {/* Découverte du jour */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Eyebrow>Découverte du jour</Eyebrow>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dateLongue()}</div>
        </div>

        {/* Carte région — photo du vignoble en fond (si dispo), sinon dégradé */}
        <div
          onClick={() => actions.go('region', { regionId: featured.id })}
          style={{
            cursor: 'pointer',
            position: 'relative',
            marginTop: 10,
            borderRadius: 'var(--r-card)',
            overflow: 'hidden',
            background: HERO_GRAD,
            color: '#f6f1e6',
          }}
        >
          {featured.img && (
            <>
              <img
                src={`/regions/${featured.img}`}
                alt={`Vignoble · ${featured.name}`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(20,8,10,0.30) 0%, rgba(20,8,10,0.66) 55%, rgba(20,8,10,0.90) 100%)',
                }}
              />
            </>
          )}
          <div
            style={{
              position: 'relative',
              padding: '22px 20px',
              paddingTop: featured.img ? 92 : 22,
              // Les photos de vignoble ont souvent un ciel clair en haut : sans
              // ombre portée, le sur-titre y perd son contraste.
              textShadow: featured.img ? '0 1px 4px rgba(0,0,0,0.7)' : undefined,
            }}
          >
            <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-light)', opacity: 0.9 }}>
              La région
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, marginTop: 2 }}>
              {featured.name}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{featured.tagline}</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 18, fontSize: 12, letterSpacing: '.5px' }}>
              <div>
                <span style={{ color: 'var(--gold)' }}>{featured.aoc}</span> AOC
              </div>
              <div>
                <span style={{ color: 'var(--gold)' }}>{featured.ha}</span> ha
              </div>
            </div>
            {/* Les photos sont en CC BY-SA : l'attribution suit l'image partout
                où elle est affichée, pas seulement sur la fiche région. */}
            {featured.img && featured.credit && (
              <div style={{ marginTop: 10, fontSize: 9.5, letterSpacing: '0.3px', color: 'rgba(246,241,230,0.55)' }}>
                📷 {featured.credit}
              </div>
            )}
          </div>
        </div>

        {/* Cépage + bouteille */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card onClick={() => actions.go('regions', { regionsView: 'cepages' })}>
            <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Le cépage
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 3 }}>
              <CepageGlyph nom={cepage.nom} tint={cepage.tint} couleur={cepage.couleur} height={42} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.1 }}>
                  {cepage.nom}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {cepage.couleur} · {cepage.origine}
                </div>
              </div>
            </div>
          </Card>
          <Card
            onClick={() =>
              actions.go('bouteilles', { wineSel: bouteille.id, wineColor: 'tous', wineRegionFilter: 'toutes' })
            }
          >
            <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              La bouteille
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 3 }}>
              <BottleGlyph couleur={bouteille.couleur} regionId={bouteille.regionId} height={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.15 }}>
                  {bouteille.domaine}
                  {bouteille.cuvee ? ` · ${bouteille.cuvee}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {bouteille.appellation}
                  {bouteille.millesime ? ` · ${bouteille.millesime}` : ''} · {bouteille.couleur}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Domaine */}
        <Card onClick={() => openInBouteilles(ALL, domaine.nom)} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Le domaine
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--gold)' }}>
              {domaine.nom}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }}>{domaine.lieu}</div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.55 }}>{domaine.txt}</div>
        </Card>

        {/* Anecdote */}
        <div
          style={{
            marginTop: 12,
            background: 'var(--surface-hollow)',
            border: '1px solid var(--gold-border)',
            borderRadius: 'var(--r-card)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)' }}>
            L'anecdote du jour
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.6, fontStyle: 'italic' }}>
            {anecdote}
          </div>
        </div>
      </div>

      {/* Raccourcis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card onClick={() => actions.go('accords')} style={{ padding: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--gold)' }}>
            Accords mets &amp; vins
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            {ACCORDS.length} accords de référence
          </div>
        </Card>
        <Card onClick={() => actions.go('degustation')} style={{ padding: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--gold)' }}>
            Carnet de dégustation
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{notes.length} notes enregistrées</div>
        </Card>
      </div>

      {/* Alerte pic de maturité */}
      {alerts.length > 0 && (
        <Card
          gold
          onClick={() => actions.go('cave', { caveSel: alerts.length === 1 ? alerts[0].id : null })}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>
              Pic de maturité
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {alerts.length}
              {alerts.length > 1
                ? ' vins de votre cave sont'
                : ' vin de votre cave est'}{' '}
              dans leur fenêtre de dégustation optimale
            </div>
          </div>
          <div style={{ color: 'var(--gold)', fontSize: 18 }}>→</div>
        </Card>
      )}

      {/* Dernière dégustation */}
      <div>
        <Eyebrow>Dernière dégustation</Eyebrow>
        {!lastNote && (
          <Card onClick={() => actions.go('degustation')} style={{ marginTop: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>
              Aucune note pour l'instant — ouvrez le carnet pour enregistrer votre première dégustation.
            </div>
          </Card>
        )}
        {lastNote && (
          <Card onClick={() => actions.go('degustation')} style={{ marginTop: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>{lastNote.vin}</div>
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{lastNote.score}/100</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
              « {lastNote.texte} »
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
