import type { GlossaireFamille } from '../types';

/** Libellé et pictogramme de chaque famille de termes.
 *
 *  Les notions abstraites (acidité, équilibre, longueur…) n'ont pas de photo
 *  qui les illustre honnêtement : elles reçoivent le pictogramme de leur
 *  famille, dessiné ici en SVG pour rester net à toute taille et ne rien peser. */
export const FAMILLES: Record<GlossaireFamille, { label: string; tint: string }> = {
  degustation: { label: 'Dégustation', tint: '#c9737f' },
  viticulture: { label: 'La vigne', tint: '#6f9b62' },
  vinification: { label: 'Vinification', tint: '#b5762f' },
  elevage: { label: 'Élevage', tint: '#a0762c' },
  contenant: { label: 'Contenants', tint: '#7d8ba8' },
  defaut: { label: 'Défauts', tint: '#a44a4a' },
  classification: { label: 'Appellations', tint: '#c9a227' },
  type: { label: 'Types de vins', tint: '#8e6ba8' },
};

const PATHS: Record<GlossaireFamille, JSX.Element> = {
  // Verre de dégustation
  degustation: (
    <>
      <path d="M7 3h10c0 4.6-1.2 7.2-2.9 8.3a3.7 3.7 0 0 1-4.2 0C8.2 10.2 7 7.6 7 3Z" />
      <path d="M12 12.6V19M8.8 19h6.4" />
    </>
  ),
  // Feuille de vigne
  viticulture: (
    <>
      <path d="M12 21v-6" />
      <path d="M12 15c-4.4 0-8-2.9-8-6.5S7.6 3 12 3s8 2.9 8 5.5S16.4 15 12 15Z" />
      <path d="M12 15V5M8.4 12.3 12 9M15.6 12.3 12 9" />
    </>
  ),
  // Cuve de fermentation
  vinification: (
    <>
      <path d="M5 7h14v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" />
      <path d="M4 7h16M9 3v4M15 3v4" />
      <path d="M8 14c1.3-1.2 2.7-1.2 4 0s2.7 1.2 4 0" />
    </>
  ),
  // Barrique de côté
  elevage: (
    <>
      <path d="M6 4h12c1.4 2.3 2 5 2 8s-.6 5.7-2 8H6c-1.4-2.3-2-5-2-8s.6-5.7 2-8Z" />
      <path d="M4.5 9h15M4.5 15h15M12 4v16" />
    </>
  ),
  // Bouteille
  contenant: (
    <>
      <path d="M10 2h4v4.5l2.2 2.8A4 4 0 0 1 17 11.7V19a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-7.3a4 4 0 0 1 .8-2.4L10 6.5Z" />
      <path d="M7 14h10" />
    </>
  ),
  // Signalement d'un défaut
  defaut: (
    <>
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 9.5v4.5M12 17.2v.1" />
    </>
  ),
  // Sceau d'appellation
  classification: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M9.5 14.3 8 22l4-2.2 4 2.2-1.5-7.7" />
      <path d="m10.2 9 1.3 1.4L14 7.7" />
    </>
  ),
  // Grappe (types de vins)
  type: (
    <>
      <path d="M12 4.2V7" />
      <path d="M13.6 3.2c.9-.6 2-.7 2.9-.2" />
      <circle cx="12" cy="9.2" r="2.2" />
      <circle cx="8.3" cy="12.6" r="2.2" />
      <circle cx="15.7" cy="12.6" r="2.2" />
      <circle cx="12" cy="16" r="2.2" />
    </>
  ),
};

export function GlossIcon({ cat, size = 24 }: { cat: GlossaireFamille; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[cat]}
    </svg>
  );
}
