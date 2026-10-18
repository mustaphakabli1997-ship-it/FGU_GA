'use strict';

// Demo catalogue shown on a fresh install. Products use the built-in garment
// illustrations (`art`) until real photos are uploaded from the admin panel.
// Set SEED_DEMO=false to start with an empty shop.

const C = {
  noir: { name: 'Noir mat', hex: '#17181a' },
  anthracite: { name: 'Anthracite', hex: '#383a40' },
  argent: { name: 'Argent', hex: '#b9bcc2' },
  orange: { name: 'Orange néon', hex: '#ff4d00' },
  nuit: { name: 'Bleu nuit', hex: '#17243f' },
  kaki: { name: 'Kaki', hex: '#4b5443' },
  blanc: { name: 'Blanc cassé', hex: '#e9e6df' },
  bordeaux: { name: 'Bordeaux', hex: '#5a1a26' },
};

const S_XXL = ['S', 'M', 'L', 'XL', 'XXL'];
const S_XL3 = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const ONE = ['Unique'];

// [name, category, price, oldPrice, art, colors, sizes, featured, description]
const ROWS = [
  ['Ensemble Apex', 'ensembles', 18900, 22500, 'ensemble', [C.noir, C.anthracite, C.nuit], S_XL3, true,
    'Veste zippée et jogger assortis, bande orange sur la manche. Coupe athlétique, finitions premium.'],
  ['Ensemble Velocity Zip', 'ensembles', 16500, null, 'ensemble', [C.anthracite, C.noir, C.kaki], S_XXL, false,
    'Un ensemble complet pour la salle comme pour la ville. Veste zippée, jogger à bas élastiqué.'],
  ['Ensemble Titan', 'ensembles', 21900, null, 'ensemble', [C.noir, C.bordeaux], S_XL3, true,
    "L'ensemble signature de la collection : lignes nettes, logo BS brodé, allure haut de gamme."],

  ['T-shirt Signature BS', 'tshirts', 3500, null, 'tshirt', [C.noir, C.blanc, C.argent, C.orange], S_XL3, true,
    'Le basique indispensable, avec le monogramme BS sur la poitrine.'],
  ['T-shirt Dry-Fit Pro', 'tshirts', 3900, null, 'tshirt', [C.anthracite, C.noir, C.nuit], S_XXL, false,
    "Coupe près du corps pensée pour l'entraînement. Léger et confortable."],
  ['Polo Prestige', 'tshirts', 5900, null, 'polo', [C.noir, C.blanc, C.nuit], S_XXL, false,
    'Col classique, finitions soignées : le polo qui passe de la salle au rendez-vous.'],

  ['Hoodie Midnight', 'sweats', 9500, null, 'hoodie', [C.noir, C.anthracite, C.bordeaux], S_XL3, true,
    'Hoodie à capuche, poche kangourou et cordons contrastés. Confort maximal.'],
  ['Hoodie Silver Oversize', 'sweats', 10900, 12500, 'hoodie', [C.argent, C.noir], S_XXL, false,
    'Coupe oversize, esprit streetwear. Toucher doux et épaules tombantes.'],
  ['Sweat Essential', 'sweats', 7900, null, 'sweat', [C.noir, C.anthracite, C.kaki, C.blanc], S_XL3, false,
    'Sweat col rond à bords côtelés. Le compagnon des demi-saisons.'],

  ['Tricot Torsadé', 'tricots', 11900, null, 'knit', [C.noir, C.anthracite, C.nuit], S_XXL, true,
    'Maille torsadée, col rond et bords côtelés. Une pièce chic et sportive.'],
  ['Tricot Fine Maille', 'tricots', 9900, null, 'knit', [C.argent, C.noir, C.bordeaux], S_XXL, false,
    'Maille fine et souple, à porter seul ou sous une veste.'],
  ['Tricot Zippé Héritage', 'tricots', 12900, null, 'jacket', [C.anthracite, C.kaki], S_XXL, false,
    'Tricot zippé col montant, finitions contrastées.'],

  ['Veste Blade', 'vestes', 12900, null, 'jacket', [C.noir, C.orange], S_XXL, false,
    'Veste légère zippée, coupe droite et bande latérale reflet argent.'],
  ['Bomber Elite', 'vestes', 15900, 18900, 'jacket', [C.noir, C.kaki, C.bordeaux], S_XL3, true,
    'Bomber à col côtelé, esprit premium. Le détail orange fait la différence.'],

  ['Jogger Tech Slim', 'pantalons', 6900, null, 'jogger', [C.noir, C.anthracite, C.nuit], S_XL3, true,
    'Jogger fuselé, taille élastiquée avec cordon et bas resserré.'],
  ['Jogger Urban', 'pantalons', 8500, null, 'jogger', [C.kaki, C.noir], S_XXL, false,
    'Jogger urbain avec poches latérales. Style décontracté et pratique.'],
  ['Pantalon Classic Track', 'pantalons', 6500, null, 'pants', [C.noir, C.nuit, C.anthracite], S_XL3, false,
    'Pantalon de survêtement à coupe droite et bande latérale.'],
  ['Pantalon Fuselé Stretch', 'pantalons', 7900, null, 'pants', [C.noir, C.argent], S_XXL, false,
    'Coupe fuselée moderne, taille confortable et bon maintien.'],

  ['Short Training Flex', 'shorts', 3900, null, 'shorts', [C.noir, C.anthracite, C.orange], S_XL3, false,
    "Short léger pour l'entraînement, taille élastiquée avec cordon."],
  ['Short Mesh Pro', 'shorts', 4500, null, 'shorts', [C.nuit, C.noir], S_XXL, false,
    'Short aéré aux bandes latérales contrastées.'],
  ['Short Premium', 'shorts', 4900, null, 'shorts', [C.argent, C.noir, C.kaki], S_XXL, false,
    'Un short polyvalent, du terrain à la plage.'],

  ['Casquette BS Signature', 'accessoires', 2500, null, 'cap', [C.noir, C.blanc, C.orange], ONE, false,
    'Casquette ajustable avec le monogramme BS brodé.'],
  ['Sac de Sport Elite', 'accessoires', 6900, null, 'bag', [C.noir, C.anthracite], ONE, false,
    'Sac de sport spacieux, anses renforcées et logo BS.'],
  ['Pack 3 Paires de Chaussettes', 'accessoires', 1800, null, 'socks', [C.noir, C.blanc], ONE, false,
    'Chaussettes de sport montantes, vendues par lot de trois.'],
];

function demoProducts(now = Date.now()) {
  return ROWS.map(([name, category, price, oldPrice, art, colors, sizes, featured, description], i) => ({
    name,
    category,
    price,
    oldPrice,
    description,
    sizes,
    colors,
    art,
    featured,
    soldOut: false,
    published: true,
    images: [],
    // spread creation dates so "Nouveautés" has a stable order
    createdAt: new Date(now - i * 36e5).toISOString(),
  }));
}

module.exports = { demoProducts };
