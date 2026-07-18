import { useStore, setState, actions } from '../store';
import { Eyebrow, TextField } from '../components/ui';
import { PhotoSlot } from '../components/PhotoSlot';
import type { DegustationCrit } from '../types';

const CRIT_ROWS: [keyof DegustationCrit, string][] = [
  ['robe', 'Robe'],
  ['nez', 'Nez'],
  ['bouche', 'Bouche'],
  ['longueur', 'Longueur'],
  ['equilibre', 'Équilibre'],
  ['plaisir', 'Plaisir'],
];

const CRIT_LABELS: Record<keyof DegustationCrit, string> = {
  robe: 'Robe',
  nez: 'Nez',
  bouche: 'Bouche',
  longueur: 'Longueur',
  equilibre: 'Équilibre',
  plaisir: 'Plaisir',
};

const todayFr = () =>
  new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function Degustation() {
  const s = useStore((st) => st);

  const submit = () => {
    if (!s.formVin.trim()) return;
    actions.addNote({
      vin: s.formVin,
      score: s.formScore,
      stars: s.formStars,
      prix: s.formPrix,
      lieu: s.formLieu,
      crit: { ...s.formCrit },
      texte: s.formTexte || 'Sans commentaire',
      date: todayFr(),
      photo: s.formPhoto || undefined,
    });
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>Carnet de dégustation</div>

      {/* Formulaire */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Eyebrow>Nouvelle dégustation</Eyebrow>
        <div style={{ display: 'flex', gap: 12 }}>
          <PhotoSlot value={s.formPhoto} onChange={(v) => setState({ formPhoto: v })} width={78} height={104} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <TextField
              value={s.formVin}
              onChange={(e) => setState({ formVin: e.target.value })}
              placeholder="Vin dégusté (ex. Chablis 1er Cru 2022)"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <TextField
                value={s.formPrix}
                onChange={(e) => setState({ formPrix: e.target.value })}
                placeholder="Prix (€)"
                inputMode="numeric"
                style={{ width: '40%' }}
              />
              <TextField
                value={s.formLieu}
                onChange={(e) => setState({ formLieu: e.target.value })}
                placeholder="Où acheté"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* 6 critères */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {CRIT_ROWS.map(([key, label]) => {
            const val = s.formCrit[key];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 76, fontSize: 12.5, color: 'var(--text-3)' }}>{label}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setState((st) => ({ formCrit: { ...st.formCrit, [key]: v } }))}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '1px solid var(--gold-border)',
                        background: v <= val ? 'var(--gold)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{val}/5</div>
              </div>
            );
          })}
        </div>

        <TextField
          value={s.formTexte}
          onChange={(e) => setState({ formTexte: e.target.value })}
          placeholder="Commentaire (robe, nez, bouche, finale…)"
        />

        {/* Note /100 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={70}
            max={100}
            value={s.formScore}
            onChange={(e) => setState({ formScore: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--gold)' }}
          />
          <div style={{ fontWeight: 700, color: 'var(--gold)', minWidth: 52 }}>{s.formScore}/100</div>
        </div>

        {/* Étoiles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Note globale</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setState({ formStars: v })}
                style={{ fontSize: 22, lineHeight: 1, color: v <= s.formStars ? 'var(--gold)' : 'var(--surface-border)' }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          style={{ textAlign: 'center', background: 'var(--gold)', color: 'var(--on-gold)', padding: 11, borderRadius: 'var(--r-card)', fontSize: 14, fontWeight: 700 }}
        >
          Enregistrer la dégustation
        </button>
      </div>

      {/* Notes enregistrées */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {s.notes.map((n, i) => {
          const st = n.stars || 4;
          const starsStr = '★'.repeat(st) + '☆'.repeat(5 - st);
          const achat = n.prix && n.lieu ? `${n.prix} € · ${n.lieu}` : n.prix ? `${n.prix} €` : n.lieu || '';
          const chips = n.crit ? (Object.keys(CRIT_LABELS) as (keyof DegustationCrit)[]).map((k) => `${CRIT_LABELS[k]} ${n.crit[k] || 3}`) : [];
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-card)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {n.photo && (
                  <div style={{ width: 56, height: 74, borderRadius: 4, flexShrink: 0, background: `center/cover no-repeat url(${n.photo})` }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>{n.vin}</div>
                    <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>{n.score}/100</div>
                  </div>
                  <div style={{ marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <div style={{ fontSize: 14, color: 'var(--gold)', letterSpacing: '2px' }}>{starsStr}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{achat}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {chips.map((c, k) => (
                  <div key={k} style={{ fontSize: 10.5, color: 'var(--gold-light)', border: '1px solid var(--surface-border)', background: 'var(--surface-hollow)', borderRadius: 'var(--r-pill)', padding: '3px 9px' }}>
                    {c}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, fontStyle: 'italic' }}>« {n.texte} »</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{n.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
