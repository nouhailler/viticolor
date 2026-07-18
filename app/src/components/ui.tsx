import type { CSSProperties, ReactNode } from 'react';

// ─── Primitives réutilisables (design tokens Viticolor) ───

/** Titre d'écran : Cormorant 28px + sous-titre optionnel. */
export function ScreenHeading({
  title,
  subtitle,
  size = 28,
}: {
  title: string;
  subtitle?: ReactNode;
  size?: number;
}) {
  return (
    <div>
      <div
        style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 600, lineHeight: 1.1 }}
      >
        {title}
      </div>
      {subtitle !== undefined && (
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}

/** Étiquette or en capitales espacées (eyebrow). */
export function Eyebrow({
  children,
  size = 13,
  color = 'var(--gold)',
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: size,
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color,
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Micro-label 10.5px uppercase letterspacing 1.5px. */
export function MicroLabel({ children, color = 'var(--text-muted)' }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color }}>
      {children}
    </div>
  );
}

/** Carte / surface bordée. */
export function Card({
  children,
  onClick,
  gold = false,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  gold?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${gold ? 'var(--gold-border)' : 'var(--surface-border)'}`,
        borderRadius: 'var(--r-card)',
        padding: 14,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Puce / chip de filtre. Devient pleine or quand active. */
export function Chip({
  label,
  active,
  onClick,
  inactiveBg = 'transparent',
  inactiveColor = 'var(--gold)',
  style,
}: {
  label: ReactNode;
  active: boolean;
  onClick?: () => void;
  inactiveBg?: string;
  inactiveColor?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--r-pill)',
        fontSize: 12,
        border: `1px solid ${active ? 'var(--gold)' : 'var(--surface-border)'}`,
        color: active ? 'var(--on-gold)' : inactiveColor,
        background: active ? 'var(--gold)' : inactiveBg,
        whiteSpace: 'nowrap',
        minHeight: 32,
        ...style,
      }}
    >
      {label}
    </button>
  );
}

/** Jauge à 5 pastilles (acidité, tanins, critères de dégustation…). */
export function DotGauge({
  value,
  onSet,
  onColor = 'var(--gold)',
  offColor = '#5d2530',
  size = 9,
  gap = 4,
}: {
  value: number;
  onSet?: (v: number) => void;
  onColor?: string;
  offColor?: string;
  size?: number;
  gap?: number;
}) {
  return (
    <div style={{ display: 'flex', gap }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          onClick={onSet ? () => onSet(n) : undefined}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: n <= value ? onColor : offColor,
            cursor: onSet ? 'pointer' : undefined,
          }}
        />
      ))}
    </div>
  );
}

/** Bouton pleine largeur : plein or ou contour. */
export function ActionButton({
  children,
  onClick,
  variant = 'solid',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'outline';
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    textAlign: 'center',
    padding: 12,
    borderRadius: 'var(--r-card)',
    fontSize: 14,
    width: '100%',
    display: 'block',
  };
  const skin: CSSProperties =
    variant === 'solid'
      ? { background: 'var(--gold)', color: 'var(--on-gold)', fontWeight: 700 }
      : { border: '1px solid var(--gold)', color: 'var(--gold)', background: 'transparent' };
  return (
    <button onClick={onClick} style={{ ...base, ...skin, ...style }}>
      {children}
    </button>
  );
}

/** Petit rond ±  (compteurs de quantité, zoom). */
export function RoundBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        border: '1px solid var(--gold-border)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gold)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/** Encart anecdote / astuce à liseré or gauche. */
export function GoldAside({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderLeft: '2px solid var(--gold)',
        padding: '11px 14px',
        fontSize: 12.5,
        color: 'var(--gold-light)',
        fontStyle: 'italic',
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

/** Champ texte stylé. */
export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        padding: '10px 12px',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--r-card)',
        background: 'var(--surface-hollow)',
        color: 'var(--text)',
        outline: 'none',
        width: '100%',
        ...props.style,
      }}
    />
  );
}
