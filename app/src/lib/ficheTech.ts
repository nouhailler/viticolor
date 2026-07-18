export interface FicheTech {
  rend: string;
  elev: string;
  lev: string;
  prat: string;
}

/** Fiche technique déduite du type d'appellation (identique au prototype). */
export function ficheTech(t: string): FicheTech {
  if (t.includes('liquoreux') || t.includes('moelleux'))
    return { rend: '18 hl/ha', elev: '24 mois · 60 % fût neuf', lev: 'Indigènes, tries botrytisées', prat: 'Vendanges manuelles par tries successives' };
  if (t.includes('effervescent'))
    return { rend: '65 hl/ha', elev: '36 mois minimum sur lattes', lev: 'Sélectionnées (prise de mousse)', prat: 'Pressurage doux 4 000 kg, réserve perpétuelle' };
  if (t.includes('vin jaune'))
    return { rend: '30 hl/ha', elev: '75 mois sous voile, sans ouillage', lev: 'Voile de levures indigènes', prat: 'Fûts non ouillés, chai ventilé, clavelin 62 cl' };
  if (t.includes('vin doux'))
    return { rend: '30 hl/ha', elev: '30 mois en bonbonnes puis foudres', lev: 'Mutage sur grains', prat: 'Élevage oxydatif en plein air, solera partielle' };
  if (t.includes('blanc'))
    return { rend: '48 hl/ha', elev: '11 mois · 25 % fût neuf, bâtonnage léger', lev: 'Indigènes, débourbage à froid', prat: 'Labour inter-rang, enherbement, certification HVE' };
  if (t.includes('rosé'))
    return { rend: '55 hl/ha', elev: '6 mois cuve inox sur lies fines', lev: 'Sélectionnées, fermentation 16 °C', prat: 'Pressurage direct de nuit, protection CO₂' };
  return { rend: '40 hl/ha', elev: '16 mois · 35 % fût neuf', lev: 'Indigènes, pied de cuve', prat: 'Labour, cuivre-soufre raisonné, vendange manuelle triée' };
}
