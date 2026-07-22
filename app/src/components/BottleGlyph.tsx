import { REGIONS } from '../data';
import type { Couleur } from '../types';

// ─── Vignette de bouteille générée (SVG) ───
// Pas de photos libres de droits pour tout le catalogue : chaque bouteille
// reçoit une silhouette fidèle à son type, une robe à la couleur du vin et
// une étiquette au liseré de sa région. Fonctionne pour tout vin, y compris
// les imports futurs.

type Shape = 'bordelaise' | 'bourguignonne' | 'flute' | 'champenoise';

// Silhouettes (viewBox 0 0 64 220, goulot en haut).
const PATHS: Record<Shape, string> = {
  bordelaise:
    'M27 8 L37 8 L37 58 C37 66 52 68 52 80 L52 204 Q52 212 44 212 L20 212 Q12 212 12 204 L12 80 C12 68 27 66 27 58 Z',
  bourguignonne:
    'M27 8 L37 8 L37 48 C37 62 54 74 54 96 L54 204 Q54 212 46 212 L18 212 Q10 212 10 204 L10 96 C10 74 27 62 27 48 Z',
  flute:
    'M28 6 L36 6 L36 60 C36 82 46 98 46 122 L46 206 Q46 212 40 212 L24 212 Q18 212 18 206 L18 122 C18 98 28 82 28 60 Z',
  champenoise:
    'M26 10 L38 10 L38 44 C38 60 56 72 56 98 L56 202 Q56 212 46 212 L18 212 Q8 212 8 202 L8 98 C8 72 26 60 26 44 Z',
};

// Régions embouteillant traditionnellement en bourguignonne (épaules fuyantes).
const BOURGOGNE_LIKE = new Set(['bourgogne', 'rhone', 'loire', 'beaujolais', 'jura', 'savoie', 'auvergne']);

function shapeFor(couleur: Couleur, regionId?: string): Shape {
  if (couleur === 'effervescent' || regionId === 'champagne') return 'champenoise';
  if (regionId === 'alsace' || regionId === 'lorraine') return 'flute';
  if (regionId && BOURGOGNE_LIKE.has(regionId)) return 'bourguignonne';
  return 'bordelaise';
}

// Robe (verre + vin stylisés) par couleur.
const ROBE: Record<Couleur, string> = {
  rouge: '#5c1a28',
  blanc: '#c9a44d',
  rosé: '#d98a8a',
  effervescent: '#3d4a34',
  liquoreux: '#b08d3e',
};

const REGION_TINT = new Map(REGIONS.map((r) => [r.id, r.tint]));

interface BottleGlyphProps {
  couleur: Couleur;
  regionId?: string;
  /** Millésime affiché sur l'étiquette (lisible en grande taille uniquement). */
  millesime?: number | null;
  height?: number;
  /** true = grande vignette de fiche : étiquette détaillée et millésime. */
  detail?: boolean;
}

export function BottleGlyph({ couleur, regionId, millesime, height = 48, detail = false }: BottleGlyphProps) {
  const shape = shapeFor(couleur, regionId);
  const robe = ROBE[couleur];
  const tint = (regionId && REGION_TINT.get(regionId)) || 'var(--gold)';
  // L'étiquette suit la largeur du corps de chaque silhouette.
  const lx = shape === 'champenoise' ? 13 : shape === 'flute' ? 21 : shape === 'bourguignonne' ? 15 : 17;
  const lw = 64 - 2 * lx;
  const ly = shape === 'flute' ? 138 : 124;

  return (
    <svg
      viewBox="0 0 64 220"
      height={height}
      width={(height * 64) / 220}
      role="img"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Capsule */}
      <rect x="25" y="2" width="14" height={shape === 'champenoise' ? 22 : 16} rx="3" fill={detail ? '#b08d3e' : tint} />
      {/* Corps */}
      <path d={PATHS[shape]} fill={robe} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      {/* Reflet */}
      <rect x="18" y="60" width="5" height="140" rx="2.5" fill="rgba(255,255,255,0.16)" />
      {/* Étiquette */}
      <rect x={lx} y={ly} width={lw} height="46" rx="3" fill="#f3ead6" />
      <rect x={lx} y={ly} width={lw} height="6" rx="3" fill={tint} />
      {detail && millesime ? (
        <text
          x="32"
          y={ly + 30}
          textAnchor="middle"
          fontSize="13"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fill="#5a4632"
        >
          {millesime}
        </text>
      ) : (
        <>
          {/* Faux texte d'étiquette (abstrait, lisible comme motif en petite taille) */}
          <rect x={lx + 6} y={ly + 16} width={lw - 12} height="4" rx="2" fill="#c9b896" />
          <rect x={lx + 10} y={ly + 26} width={lw - 20} height="3" rx="1.5" fill="#d8cbae" />
        </>
      )}
    </svg>
  );
}
