// ─── Vignette de cépage générée (SVG) ───
// Grappe stylisée à la teinte du cépage, feuille de vigne, et silhouette
// légèrement différenciée par variété (dérivée du nom, déterministe) :
// pas d'images à embarquer, cohérent avec les vignettes de bouteilles.

interface CepageGlyphProps {
  nom: string;
  tint: string;
  /** 'Rouge' | 'Blanc' (ou 'rouge'/'blanc') — teinte la feuille. */
  couleur?: string;
  height?: number;
}

// Petit hachage stable pour varier la grappe d'un cépage à l'autre.
function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// Grappes possibles : compacte (pinot…), allongée (chenin…), large (grenache…).
const LAYOUTS: number[][] = [
  [4, 3, 3, 2, 1],
  [3, 3, 2, 2, 1, 1],
  [4, 4, 3, 2, 1],
];

export function CepageGlyph({ nom, tint, couleur = 'Rouge', height = 44 }: CepageGlyphProps) {
  const h = hash(nom);
  const layout = LAYOUTS[h % LAYOUTS.length];
  const r = 5.6 + (h % 3) * 0.5; // taille des baies
  const leafLeft = h % 2 === 0; // orientation de la feuille
  const leaf = couleur.toLowerCase().startsWith('b') ? '#6b7a3a' : '#7a5a2e';

  const berries: { x: number; y: number }[] = [];
  layout.forEach((n, row) => {
    const y = 26 + row * r * 1.62;
    const jitter = ((h >> (row * 3)) % 5) - 2; // léger décalage par rangée
    for (let i = 0; i < n; i++) {
      berries.push({ x: 32 - ((n - 1) * r * 1.72) / 2 + i * r * 1.72 + jitter * 0.8, y });
    }
  });

  return (
    <svg
      viewBox="0 0 64 88"
      height={height}
      width={(height * 64) / 88}
      role="img"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Rafle */}
      <path d="M32 4 C32 10 31 16 31 24" stroke="#7a5a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Feuille de vigne */}
      <path
        d={
          leafLeft
            ? 'M31 12 C22 4 10 6 8 14 C12 24 24 23 31 16 Z'
            : 'M33 12 C42 4 54 6 56 14 C52 24 40 23 33 16 Z'
        }
        fill={leaf}
        opacity="0.9"
      />
      {/* Vrille */}
      <path
        d={leafLeft ? 'M33 10 C40 8 44 12 42 16' : 'M31 10 C24 8 20 12 22 16'}
        stroke="#8a7a4a"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Baies (de bas en haut pour que les rangées hautes chevauchent) */}
      {[...berries].reverse().map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={r} fill={tint} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <circle cx={b.x - r / 3} cy={b.y - r / 3} r={r / 3.2} fill="rgba(255,255,255,0.28)" />
        </g>
      ))}
    </svg>
  );
}
