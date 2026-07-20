import { useStore, setState } from '../store';
import { GLOSSAIRE, GLOSSAIRE_MEDIA } from '../data';
import { normalize } from '../lib/helpers';
import { ScreenHeading, TextField } from '../components/ui';
import { GlossIcon, FAMILLES } from '../components/GlossIcon';
import type { GlossaireFamille, GlossaireTerme } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FAMILLE_IDS = Object.keys(FAMILLES) as GlossaireFamille[];

/** Termes du glossaire cités dans la définition d'un autre terme.
 *
 *  Rien n'est rédigé ici : on relit les définitions existantes et on y repère
 *  les termes qui ont eux-mêmes une entrée, ce qui donne des renvois sans
 *  inventer de contenu. Les termes courts (≤ 3 lettres) sont écartés pour
 *  éviter les correspondances fortuites. */
function termesLies(entry: GlossaireTerme): GlossaireTerme[] {
  const hay = normalize(`${entry.def} ${entry.terme}`);
  const liens = GLOSSAIRE.filter((g) => {
    if (g.terme === entry.terme) return false;
    // On ne garde que le premier mot significatif (« Garde (vin de) » → « garde »).
    const base = normalize(g.terme.replace(/\s*\(.*\)\s*/, ''));
    if (base.length <= 3) return false;
    return hay.includes(base);
  });
  // À défaut de citation, on propose les voisins de la même famille.
  if (liens.length) return liens.slice(0, 6);
  return GLOSSAIRE.filter((g) => g.cat === entry.cat && g.terme !== entry.terme).slice(0, 4);
}

export function Glossaire() {
  const { glossQuery, glossLettre, glossCat, glossSel } = useStore((s) => ({
    glossQuery: s.glossQuery,
    glossLettre: s.glossLettre,
    glossCat: s.glossCat,
    glossSel: s.glossSel,
  }));

  const selected = glossSel ? GLOSSAIRE.find((g) => g.terme === glossSel) : null;
  if (selected) return <FicheTerme entry={selected} />;

  const q = glossQuery.trim();
  let list = GLOSSAIRE;
  if (q) {
    const nq = normalize(q);
    list = GLOSSAIRE.filter((g) => normalize(g.terme).includes(nq) || normalize(g.def).includes(nq));
  } else if (glossLettre) {
    list = GLOSSAIRE.filter((g) => normalize(g.terme)[0] === glossLettre.toLowerCase());
  }
  if (glossCat) list = list.filter((g) => g.cat === glossCat);

  const lettres = ALPHABET.filter((ch) => GLOSSAIRE.some((g) => normalize(g.terme)[0] === ch.toLowerCase()));
  const empty = list.length === 0 && GLOSSAIRE.length > 0;
  const tronque = list.length > 60;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenHeading title="Glossaire" subtitle={`${GLOSSAIRE.length} termes · touchez une fiche pour la déplier`} />
      <TextField
        value={glossQuery}
        onChange={(e) => setState({ glossQuery: e.target.value, glossLettre: null })}
        placeholder="Rechercher un terme (tanins, malo, terroir…)"
        style={{ background: 'var(--surface)', padding: '11px 14px' }}
      />

      {/* Familles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {FAMILLE_IDS.map((id) => {
          const f = FAMILLES[id];
          const active = glossCat === id;
          const n = GLOSSAIRE.filter((g) => g.cat === id).length;
          return (
            <button
              key={id}
              onClick={() => setState((s) => ({ glossCat: s.glossCat === id ? null : id }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 'var(--r-pill)',
                fontSize: 11.5,
                border: `1px solid ${active ? f.tint : 'var(--surface-border)'}`,
                background: active ? f.tint : 'var(--surface-hollow)',
                color: active ? '#1b0d10' : 'var(--text-3)',
              }}
            >
              <span style={{ display: 'flex', color: active ? '#1b0d10' : f.tint }}>
                <GlossIcon cat={id} size={14} />
              </span>
              {f.label}
              <span style={{ opacity: 0.7 }}>{n}</span>
            </button>
          );
        })}
      </div>

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
        {list.slice(0, 60).map((g) => {
          const f = FAMILLES[g.cat];
          const media = GLOSSAIRE_MEDIA[g.terme];
          return (
            <button
              key={g.terme}
              onClick={() => setState({ glossSel: g.terme })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--r-card)',
                padding: '12px 15px',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  background: media ? 'transparent' : `${f.tint}22`,
                  border: `1px solid ${f.tint}55`,
                  color: f.tint,
                }}
              >
                {media ? (
                  <img
                    src={`/glossaire/${media.img}`}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <GlossIcon cat={g.cat} size={20} />
                )}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--gold)' }}>
                  {g.terme}
                </span>
                <span
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: 12.5,
                    color: 'var(--text-3)',
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {g.def}
                </span>
              </span>
              <span style={{ flexShrink: 0, color: 'var(--text-muted)', fontSize: 16 }}>›</span>
            </button>
          );
        })}
      </div>

      {tronque && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          60 termes affichés sur {list.length} — affinez avec la recherche, une famille ou une lettre.
        </div>
      )}
      {empty && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
          Aucun terme trouvé.
        </div>
      )}
    </div>
  );
}

// ─── Fiche d'un terme ───
function FicheTerme({ entry }: { entry: GlossaireTerme }) {
  const f = FAMILLES[entry.cat];
  const media = GLOSSAIRE_MEDIA[entry.terme];
  const lies = termesLies(entry);
  const cites = GLOSSAIRE.filter((g) => {
    const base = normalize(entry.terme.replace(/\s*\(.*\)\s*/, ''));
    return base.length > 3 && g.terme !== entry.terme && normalize(g.def).includes(base);
  }).slice(0, 6);

  return (
    <div>
      {/* Illustration, ou pictogramme de famille à défaut */}
      <div style={{ position: 'relative', height: media ? 190 : 130, overflow: 'hidden', background: `linear-gradient(160deg, ${f.tint}33, var(--surface-hollow))` }}>
        {media ? (
          <>
            <img
              src={`/glossaire/${media.img}`}
              alt={entry.terme}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,8,10,0.2), rgba(20,8,10,0.85))' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: f.tint, opacity: 0.55 }}>
            <GlossIcon cat={entry.cat} size={62} />
          </div>
        )}
        <button
          onClick={() => setState({ glossSel: null })}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '6px 12px',
            borderRadius: 'var(--r-pill)',
            fontSize: 12,
            background: 'rgba(20,8,10,0.6)',
            border: '1px solid var(--gold-border)',
            color: 'var(--gold-light)',
          }}
        >
          ← Glossaire
        </button>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: f.tint, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            <GlossIcon cat={entry.cat} size={14} />
            {f.label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
            {entry.terme}
          </div>
        </div>

        <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>{entry.def}</div>

        {media && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            📷 {media.credit} · Wikimedia Commons
          </div>
        )}

        {lies.length > 0 && (
          <Renvois titre="Termes liés" items={lies} />
        )}
        {cites.length > 0 && (
          <Renvois titre={`Définitions qui mentionnent « ${entry.terme} »`} items={cites} />
        )}
      </div>
    </div>
  );
}

function Renvois({ titre, items }: { titre: string; items: GlossaireTerme[] }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
        {titre}
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {items.map((g) => (
          <button
            key={g.terme}
            onClick={() => setState({ glossSel: g.terme })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 'var(--r-pill)',
              fontSize: 12.5,
              border: '1px solid var(--gold-border)',
              background: 'var(--surface-hollow)',
              color: 'var(--text-2)',
            }}
          >
            <span style={{ display: 'flex', color: FAMILLES[g.cat].tint }}>
              <GlossIcon cat={g.cat} size={13} />
            </span>
            {g.terme}
          </button>
        ))}
      </div>
    </div>
  );
}
