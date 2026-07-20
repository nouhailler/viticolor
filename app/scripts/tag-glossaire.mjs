#!/usr/bin/env node
/**
 * Ajoute un champ `cat` (famille) à chaque entrée de glossaire.json.
 *
 * Les définitions ne sont pas touchées : on se contente de ranger les termes,
 * ce qui permet de leur associer un pictogramme et de proposer une navigation
 * par famille.
 *
 *   node scripts/tag-glossaire.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'glossaire.json',
);

// Classement établi terme à terme : trop de faux amis pour des règles
// automatiques (« Climat » est une parcelle bourguignonne, pas la météo ;
// « Marc » est un résidu de pressurage, pas une eau-de-vie ici).
const CATS = {
  degustation: [
    'Acidité', 'Aération', 'Ample', 'Animal', 'Âpre', 'Arômes primaires',
    'Arômes secondaires', 'Arômes tertiaires', 'Astringence', 'Attaque',
    'Boisé', 'Bouche', 'Bouquet', 'Capiteux', 'Carafage', 'Charnu',
    'Charpenté', 'Complexité', 'Concentration', 'Corsé', 'Court',
    'Empyreumatique', 'Équilibre', 'Finale', 'Fruité', 'Gouleyant', 'Gras',
    'Herbacé', 'Larmes', 'Longueur', 'Minéral', 'Nerveux', 'Nez', 'Perlant',
    'Pierre à fusil', 'Rétro-olfaction', 'Robe', 'Rond', 'Soyeux', 'Structure',
    'Tanins', 'Typicité', 'Amertume', 'Caudalie', 'Épices', 'Floral', 'Fondu',
    'Franc', 'Salinité', 'Sapide', 'Tannique', 'Tuilé', 'Végétal', 'Vif',
  ],
  viticulture: [
    'Ampélographie', 'Aromatique (cépage)', 'Ban des vendanges', 'Biodynamie',
    'Botrytis', 'Cep', 'Cépage', 'Clone', 'Coulure', 'Débourrement',
    'Éclaircissage', 'Effeuillage', 'Enherbement', 'Floraison',
    'Gelée de printemps', 'Greffage', 'Hybride', 'Nouaison', 'Passerillage',
    'Phénolique (maturité)', 'Phylloxéra', 'Porte-greffe', 'Pourriture grise',
    'Rendement', 'Rognage', 'Sélection massale', 'Terroir', 'Tries', 'Tuffeau',
    'Vendange verte', 'Véraison', 'Vivace', 'Agriculture biologique', 'Esca',
    'Franc de pied', 'Gobelet', 'Guyot', 'Mildiou', 'Millerandage', 'Oïdium',
    'Palissage', 'Sarment', 'Taille', 'Vendange', 'Vieilles vignes',
  ],
  vinification: [
    'Assemblage', 'Baumé', 'Bourbes', 'Chaptalisation', 'Collage', 'Cuvaison',
    'Cuvée', 'Débourbage', 'Décuvage', 'Dégorgement', 'Dosage', 'Égrappage',
    'Éraflage', 'Extraction', 'Fermentation alcoolique',
    'Fermentation malolactique', 'Filtration', 'Glycérol', 'Goutte (vin de)',
    'Levures', 'Levures indigènes', 'Macération', 'Macération carbonique',
    'Marc', 'Méthode traditionnelle', 'Mutage', 'Pigeage', 'Pressurage',
    'Prise de mousse', 'Rafle', 'Remontage', 'Remuage', 'Sucres résiduels',
    'Sulfites', 'Sur lattes', 'Tirage', 'Vin de goutte', 'Vin de presse',
    'Vinification', 'Levurage', 'Moût', 'Pressurage direct', 'Saignée',
    'Sulfitage', 'Thermovinification',
  ],
  elevage: [
    'Apogée', 'Bâtonnage', 'Chai', 'Dépôt', 'Élevage', 'Garde (vin de)',
    'Gravelle', 'Lies', 'Ouillage', 'Oxydatif (élevage)', 'Part des anges',
    'Rancio', 'Solera', 'Soutirage', 'Sur lie', 'Amphore', 'Bois neuf',
    'Cuve œuf', 'Merrain', 'Micro-oxygénation', 'Tonnellerie',
  ],
  contenant: [
    'Barrique', 'Clavelin', 'Douelle', 'Foudre', 'Fût', 'Jéroboam', 'Magnum',
    'Pièce', 'Tastevin', 'Bag-in-box', 'Bordelaise', 'Bourguignonne', 'Flûte',
    'Muselet', 'Nabuchodonosor',
  ],
  defaut: [
    'Acescence', 'Bouchonné', 'Brett', 'Madérisé', 'Réduction', 'TCA',
    'Volatile (acidité)', 'Évent', 'Géosmine', 'Goût de lumière',
    'Goût de souris', 'Oxydation',
  ],
  classification: [
    'AOC', 'Climat', 'Clos', 'Cru', 'Générique', 'Grand cru', 'HVE', 'INAO',
    'Millésime', 'Monopole', 'Négociant', 'Premier cru', 'Second vin',
    'Sommelier', 'Vigneron', 'AOP', 'Château', 'Classement de 1855',
    'Coopérative', 'Cru bourgeois', 'Domaine', 'IGP', 'Lieu-dit',
    'Vin de France',
  ],
  type: [
    'Blanc de blancs', 'Blanc de noirs', 'Brut', 'Brut nature', 'Crémant',
    'Demi-sec', 'Liquoreux', 'Mistelle', 'Moelleux', 'Nature (vin)', 'Sec',
    'Tranquille (vin)', 'Vendanges tardives', 'Vin de garde', 'Vin de voile',
    'Vin doux naturel', 'Vin jaune', 'Vin muté', 'Vin orange', 'Champagne',
    'Effervescent', 'Macvin', 'Méthode ancestrale', 'Pétillant naturel',
    'Rosé', 'Vin de paille', 'Vin gris',
  ],
};

const byTerm = new Map();
for (const [cat, terms] of Object.entries(CATS)) {
  for (const t of terms) {
    if (byTerm.has(t)) throw new Error(`« ${t} » classé deux fois`);
    byTerm.set(t, cat);
  }
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const manquants = [];
for (const entry of data) {
  const cat = byTerm.get(entry.terme);
  if (!cat) manquants.push(entry.terme);
  else entry.cat = cat;
  byTerm.delete(entry.terme);
}

// Un terme classé mais absent du glossaire signale une faute de frappe dans la
// liste ci-dessus — on préfère le savoir tout de suite.
const orphelins = [...byTerm.keys()];

if (manquants.length) console.error('⚠️  sans famille :', manquants.join(' · '));
if (orphelins.length) console.error('⚠️  classés mais inconnus :', orphelins.join(' · '));
if (manquants.length || orphelins.length) process.exit(1);

fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
const counts = {};
for (const e of data) counts[e.cat] = (counts[e.cat] ?? 0) + 1;
console.log(`✅ ${data.length} termes classés`);
for (const [c, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(n).padStart(3)} · ${c}`);
}
