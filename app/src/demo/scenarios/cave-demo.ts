import type { CaveItem } from '../../types';

/** Cave de départ des scénarios : seed isolé, jamais persisté — la vraie cave
 *  de l'utilisateur n'est ni affichée ni modifiée pendant une démo. */
export const CAVE_DEMO: CaveItem[] = [
  {
    id: 'demo-b1',
    name: 'Meursault « Charmes » 2020',
    meta: 'Bourgogne · blanc',
    apogee: '2025–2032',
    from: 2025,
    to: 2032,
    prix: 85,
    delta: 8,
    color: 'blanc',
    tint: '#c9a44d',
    qty: 2,
  },
  {
    id: 'demo-b2',
    name: 'Cornas « Reynard » 2019',
    meta: 'Vallée du Rhône · rouge',
    apogee: '2026–2038',
    from: 2026,
    to: 2038,
    prix: 68,
    delta: 11,
    color: 'rouge',
    tint: '#6e1f2e',
    qty: 3,
  },
];
