// GÉNÉRÉ par scripts/build-rivers.mjs — ne pas éditer à la main.
//
// Principaux cours d'eau français, projetés dans le repère de france-map.ts
// (même viewBox). Tracés simplifiés pour l'affichage mobile : aucune valeur
// hydrographique. Voir l'en-tête du script pour la méthode de calage.

export interface River {
  id: string;
  name: string;
  /** Polyligne SVG dans le repère FRANCE_VIEWBOX. */
  d: string;
}

export const FRANCE_RIVERS: River[] = [
  { id: "loire", name: "La Loire", d: 'M628 633.6L617.6 581.9L617.6 512.9L605.8 465.3L554.2 415.6L515.2 384.2L473.4 338.5L467.1 323.3L431.6 353.8L382.1 375L337.5 382.1L295.7 372L253.9 389.2L226.1 393.3L180.8 386.2' },
  { id: "garonne", name: "La Garonne", d: 'M384.2 809L414.2 784.7L434.4 759.3L410.7 728.9L377.3 698.5L341 668.1L309.7 645.8L294.4 630.5L295.7 614.3L285.3 587L274.1 571.7L262.3 558.6' },
  { id: "dordogne", name: "La Dordogne", d: 'M437.2 627.5L396.8 632.6L367.5 632.6L334.1 627.5L317.3 626.5L295.7 614.3' },
  { id: "lot", name: "Le Lot", d: 'M513.1 653.9L466.4 671.1L434.4 673.1L396.8 678.2L357.7 688.3' },
  { id: "rhone", name: "Le Rhône", d: 'M762.5 495.7L740.2 518L703.3 536.3L670.5 540.3L669.8 587L674.7 624.5L658 657.9L669.1 704.6L669.1 723.8L656.6 751.2L671.9 784.7' },
  { id: "saone", name: "La Saône", d: 'M724.2 353.8L709.6 395.3L671.9 436.9L670.5 484.5L670.5 521L670.5 540.3' },
  { id: "doubs", name: "Le Doubs", d: 'M807.8 362.9L753.4 390.3L716.5 405.5L683.8 424.7' },
  { id: "isere", name: "L'Isère", d: 'M789 568.7L779.2 549.4L755.5 566.7L732.5 598.1L703.3 607.2L674.7 624.5' },
  { id: "marne", name: "La Marne", d: 'M692.1 302L678.9 248.3L637.8 215.9L609.9 207.7L570.9 207.7L536.1 216.9L502.6 231.1' },
  { id: "seine", name: "La Seine", d: 'M626.6 323.3L618.3 282.8L591.8 262.5L539.6 274.7L497.8 227L466.4 211.8L410.7 167.2L361.9 166.2L341 162.1' },
  { id: "rhin", name: "Le Rhin", d: 'M862.8 358.8L860 323.3L863.5 311.2L874 277.7L877.4 254.4L891.4 221.9L898.3 209.8' },
  { id: "moselle", name: "La Moselle", d: 'M783.4 296L745.1 244.2L764.6 199.6L763.9 175.3L777.1 165.2' },
];
