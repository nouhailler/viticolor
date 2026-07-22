import { useState } from 'react';
import { useStore, setState, actions } from '../store';
import { QUIZ, CEPAGES, CEPAGES_LEXIQUE } from '../data';
import { normalize } from '../lib/helpers';
import { Eyebrow, Chip, TextField } from '../components/ui';
import { CepageGlyph } from '../components/CepageGlyph';

// Cépages du lexique disposant d'une fiche détaillée (Régions → Cépages) :
// index dans CEPAGES pour ouvrir la bonne fiche d'un tap.
const FICHE_INDEX = new Map(CEPAGES.map((c, i) => [normalize(c.nom), i]));
// « Malbec (Côt) » ou « Vermentino (Rolle) » : le nom hors parenthèse suffit.
const ficheFor = (nom: string): number | undefined =>
  FICHE_INDEX.get(normalize(nom)) ?? FICHE_INDEX.get(normalize(nom.replace(/\s*\(.*\)/, '')));

export function Savoir() {
  const { quizIndex, quizPicked, quizScore, quizDone } = useStore((s) => ({
    quizIndex: s.quizIndex,
    quizPicked: s.quizPicked,
    quizScore: s.quizScore,
    quizDone: s.quizDone,
  }));

  const q = QUIZ[quizIndex];
  const last = quizIndex === QUIZ.length - 1;
  const answered = quizPicked !== null;

  const verdict = quizScore >= 4 ? 'Niveau sommelier confirmé.' : quizScore >= 2 ? 'Solide — encore quelques flacons à ouvrir.' : 'Le vignoble vous attend.';

  const pick = (i: number) => {
    if (quizPicked === null) setState((s) => ({ quizPicked: i, quizScore: s.quizScore + (i === q.a ? 1 : 0) }));
  };
  const next = () =>
    setState((s) => (s.quizIndex < QUIZ.length - 1 ? { quizIndex: s.quizIndex + 1, quizPicked: null } : { quizDone: true }));
  const restart = () => setState({ quizIndex: 0, quizPicked: null, quizScore: 0, quizDone: false });

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>Parfaire son savoir</div>

      {!quizDone && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
            <Eyebrow size={12}>Quiz sommellerie</Eyebrow>
            <div>{quizIndex + 1} / {QUIZ.length}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, marginTop: 10, lineHeight: 1.3 }}>{q.q}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.opts.map((label, i) => {
              let border = 'var(--surface-border)';
              let bg = 'var(--surface-hollow)';
              let color = 'var(--text)';
              if (answered && i === q.a) {
                border = '#7fa25a';
                bg = '#2f3d28';
                color = 'var(--positive-soft)';
              } else if (answered && i === quizPicked) {
                border = '#c76a6a';
                bg = '#521c22';
                color = 'var(--negative-soft)';
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  style={{ padding: '11px 14px', borderRadius: 'var(--r-card)', fontSize: 14, border: `1px solid ${border}`, background: bg, color, textAlign: 'left' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>{q.ex}</div>
              <button
                onClick={next}
                style={{ marginTop: 12, width: '100%', textAlign: 'center', background: 'var(--gold)', color: 'var(--on-gold)', padding: 10, borderRadius: 'var(--r-card)', fontSize: 14, fontWeight: 700 }}
              >
                {last ? 'Voir le résultat' : 'Question suivante'}
              </button>
            </>
          )}
        </div>
      )}

      {quizDone && (
        <div style={{ background: 'linear-gradient(135deg, #6e2230, #8f3040)', color: '#f6f1e6', borderRadius: 'var(--r-card)', padding: 24, textAlign: 'center' }}>
          <Eyebrow size={15}>Résultat</Eyebrow>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, marginTop: 6 }}>
            {quizScore} / {QUIZ.length}
          </div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{verdict}</div>
          <button
            onClick={restart}
            style={{ marginTop: 16, display: 'inline-block', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '9px 24px', borderRadius: 'var(--r-pill)', fontSize: 14 }}
          >
            Recommencer
          </button>
        </div>
      )}

      <LexiqueCepages />
    </div>
  );
}

// ─── Lexique des cépages (recherche + filtre + lien vers les fiches) ───
function LexiqueCepages() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'tous' | 'rouge' | 'blanc'>('tous');

  const nq = normalize(query.trim());
  const list = CEPAGES_LEXIQUE.filter((c) => {
    if (filter !== 'tous' && c.type !== filter) return false;
    if (nq && !normalize(`${c.nom} ${c.desc}`).includes(nq)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow>Lexique des cépages</Eyebrow>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {list.length} / {CEPAGES_LEXIQUE.length}
        </div>
      </div>

      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cépage, région, arôme… (mondeuse, jura, litchi)"
        style={{ marginTop: 10, width: '100%', fontSize: 13.5, padding: '10px 14px', border: '1px solid var(--surface-border)', background: 'var(--surface)' }}
      />

      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        {(
          [
            ['tous', 'Tous'],
            ['rouge', 'Rouges'],
            ['blanc', 'Blancs'],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} label={label} active={filter === id} onClick={() => setFilter(id)} />
        ))}
      </div>

      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column' }}>
        {list.map((c) => {
          const fiche = ficheFor(c.nom);
          const row = (
            <>
              <CepageGlyph nom={c.nom} tint={c.tint} couleur={c.type} height={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                  <div style={{ fontWeight: 700 }}>{c.nom}</div>
                  <div style={{ color: c.tint, fontSize: 12, fontStyle: 'italic', flexShrink: 0 }}>{c.type}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{c.desc}</div>
              </div>
              {fiche != null && (
                <span style={{ fontSize: 11, color: 'var(--gold)', flexShrink: 0, whiteSpace: 'nowrap' }}>fiche ›</span>
              )}
            </>
          );
          const rowStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: '1px solid var(--surface-border)',
            width: '100%',
            textAlign: 'left',
          };
          return fiche != null ? (
            <button
              key={c.nom}
              onClick={() => actions.go('regions', { regionsView: 'cepages', cepFilter: 'tous', cepOpen: fiche })}
              style={rowStyle}
            >
              {row}
            </button>
          ) : (
            <div key={c.nom} style={rowStyle}>
              {row}
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '18px 0' }}>
            Aucun cépage ne correspond.
          </div>
        )}
      </div>
    </div>
  );
}
