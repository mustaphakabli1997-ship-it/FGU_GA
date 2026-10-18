'use strict';

// Categories shared by the storefront, the admin panel and the email templates.
// `art` is the garment illustration used when a product has no uploaded photo.
const CATEGORIES = [
  { id: 'ensembles', fr: 'Ensembles', ar: 'أطقم كاملة', short: { fr: 'Ensembles', ar: 'أطقم' }, art: 'ensemble' },
  { id: 'tshirts', fr: 'T-shirts & Polos', ar: 'تيشيرتات وبولو', short: { fr: 'T-shirts', ar: 'تيشيرتات' }, art: 'tshirt' },
  { id: 'sweats', fr: 'Sweats & Hoodies', ar: 'سويت وهودي', short: { fr: 'Sweats', ar: 'سويت' }, art: 'hoodie' },
  { id: 'tricots', fr: 'Tricots', ar: 'تريكو', short: { fr: 'Tricots', ar: 'تريكو' }, art: 'knit' },
  { id: 'vestes', fr: 'Vestes', ar: 'جاكيتات', short: { fr: 'Vestes', ar: 'جاكيتات' }, art: 'jacket' },
  { id: 'pantalons', fr: 'Pantalons & Joggers', ar: 'سراويل وجوغرز', short: { fr: 'Pantalons', ar: 'سراويل' }, art: 'jogger' },
  { id: 'shorts', fr: 'Shorts', ar: 'شورتات', short: { fr: 'Shorts', ar: 'شورتات' }, art: 'shorts' },
  { id: 'accessoires', fr: 'Accessoires', ar: 'إكسسوارات', short: { fr: 'Accessoires', ar: 'إكسسوارات' }, art: 'cap' },
];

const ART_KINDS = [
  'tshirt', 'polo', 'hoodie', 'sweat', 'knit', 'jacket',
  'jogger', 'pants', 'shorts', 'ensemble', 'cap', 'bag', 'socks',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Unique'];

const categoryIds = new Set(CATEGORIES.map((c) => c.id));
const artKinds = new Set(ART_KINDS);
const defaultArt = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)?.art || 'tshirt';

module.exports = { CATEGORIES, ART_KINDS, SIZES, categoryIds, artKinds, defaultArt };
