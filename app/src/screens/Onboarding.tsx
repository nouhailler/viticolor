import { useStore, actions } from '../store';
import { ONBOARDING } from '../data';

export function Onboarding() {
  const { obDone, obStep } = useStore((s) => ({ obDone: s.obDone, obStep: s.obStep }));
  if (obDone) return null;

  const slide = ONBOARDING[obStep];
  const last = obStep === ONBOARDING.length - 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'radial-gradient(ellipse at 50% 25%, var(--page-bg-a), var(--page-bg-b))',
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 28px 28px',
        animation: 'vcFade .25s ease',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 18,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44 }}>{slide.icone}</div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.15,
            color: 'var(--gold)',
          }}
        >
          {slide.titre}
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: 'var(--text-2)',
            lineHeight: 1.7,
            maxWidth: 300,
            margin: '0 auto',
          }}
        >
          {slide.txt}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {ONBOARDING.map((_, i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i === obStep ? 'var(--gold)' : 'var(--surface-border)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={actions.finishOnboarding}
          style={{
            flex: 1,
            textAlign: 'center',
            border: '1px solid var(--gold-border)',
            color: 'var(--gold)',
            padding: 13,
            borderRadius: 'var(--r-card)',
            fontSize: 14,
          }}
        >
          Passer
        </button>
        <button
          onClick={() => actions.nextOnboarding(last)}
          style={{
            flex: 1,
            textAlign: 'center',
            background: 'var(--gold)',
            color: 'var(--on-gold)',
            padding: 13,
            borderRadius: 'var(--r-card)',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {last ? 'Commencer' : 'Suivant'}
        </button>
      </div>
    </div>
  );
}
