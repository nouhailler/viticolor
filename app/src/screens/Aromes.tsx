import { useStore, setState } from '../store';
import { AROMES } from '../data';
import { ScreenHeading, GoldAside } from '../components/ui';

export function Aromes() {
  const aromSel = useStore((s) => s.aromSel);
  const fam = AROMES[aromSel];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenHeading title="Lexique des arômes" subtitle="Identifier et décrire ce que l'on sent" />

      {/* Familles (puces colorées) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {AROMES.map((fa, i) => {
          const active = i === aromSel;
          return (
            <button
              key={fa.nom}
              onClick={() => setState({ aromSel: i })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '8px 13px',
                borderRadius: 'var(--r-pill)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--surface-border)'}`,
                color: active ? 'var(--gold-light)' : 'var(--text-3)',
                background: active ? 'var(--surface)' : 'var(--surface-hollow)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: fa.tint }} />
              {fa.nom}
            </button>
          );
        })}
      </div>

      {/* Fiche famille */}
      <div
        style={{
          background: 'var(--surface-hollow)',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--r-card)',
          padding: '16px 18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold)' }}>
            {fam.nom}
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {fam.origine}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.6 }}>{fam.desc}</div>
      </div>

      {/* Arômes de la famille */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fam.aromes.map((ar, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-card)',
              padding: '12px 15px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold-light)' }}>
                {ar.nom}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ar.repere}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.55 }}>{ar.ou}</div>
          </div>
        ))}
      </div>

      <GoldAside>◆ {fam.astuce}</GoldAside>
    </div>
  );
}
