'use strict';
const { categoryIds, artKinds, SIZES } = require('./catalog');
const { getWilaya } = require('./wilayas');

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.status = 400;
  }
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
// Algerian mobile numbers: 05/06/07 + 8 digits, optionally written +213 5.. / 00213 5..
const PHONE_RE = /^0[567]\d{8}$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

const text = (value, { field, min = 0, max = 200, required = false } = {}) => {
  const v = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (required && v.length < Math.max(min, 1)) throw new ValidationError(`${field} requis`, field);
  if (v.length && v.length < min) throw new ValidationError(`${field} trop court`, field);
  if (v.length > max) throw new ValidationError(`${field} trop long`, field);
  return v;
};

const longText = (value, { field, max = 2000 } = {}) => {
  const v = typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
  if (v.length > max) throw new ValidationError(`${field} trop long`, field);
  return v;
};

const email = (value, { required = false } = {}) => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!v) {
    if (required) throw new ValidationError('Email requis', 'email');
    return '';
  }
  if (v.length > 120 || !EMAIL_RE.test(v)) throw new ValidationError('Email invalide', 'email');
  return v;
};

const phone = (value) => {
  let v = typeof value === 'string' ? value.replace(/[\s.\-()]/g, '') : '';
  v = v.replace(/^(\+213|00213)/, '0');
  if (!PHONE_RE.test(v)) throw new ValidationError('Numéro de téléphone invalide', 'phone');
  return v;
};

const int = (value, { field, min = 0, max = 10_000_000, required = true } = {}) => {
  if (value === '' || value === null || value === undefined) {
    if (required) throw new ValidationError(`${field} requis`, field);
    return null;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new ValidationError(`${field} invalide`, field);
  return n;
};

const bool = (value) => value === true || value === 'true' || value === '1' || value === 'on' || value === 1;

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(',');
    }
  }
  return [];
};

/** Normalises the product payload coming from the admin form (JSON or multipart fields). */
function productInput(body) {
  const category = text(body.category, { field: 'Catégorie', required: true, max: 40 });
  if (!categoryIds.has(category)) throw new ValidationError('Catégorie invalide', 'category');

  const price = int(body.price, { field: 'Prix', min: 1 });
  const oldPrice = int(body.oldPrice, { field: 'Ancien prix', min: 1, required: false });
  if (oldPrice !== null && oldPrice <= price) {
    throw new ValidationError("L'ancien prix doit être supérieur au prix", 'oldPrice');
  }

  const sizes = [...new Set(asArray(body.sizes).map((s) => String(s).trim()).filter(Boolean))];
  if (sizes.some((s) => !SIZES.includes(s))) throw new ValidationError('Taille invalide', 'sizes');

  const colors = asArray(body.colors)
    .slice(0, 12)
    .map((c) => ({
      name: text(c && c.name, { field: 'Nom de couleur', required: true, max: 30 }),
      hex: String((c && c.hex) || '').toLowerCase(),
    }));
  if (colors.some((c) => !HEX_RE.test(c.hex))) throw new ValidationError('Couleur invalide', 'colors');

  const art = text(body.art, { field: 'Illustration', max: 20 });
  if (art && !artKinds.has(art)) throw new ValidationError('Illustration invalide', 'art');

  return {
    name: text(body.name, { field: 'Nom', required: true, min: 2, max: 120 }),
    category,
    price,
    oldPrice,
    description: longText(body.description, { field: 'Description' }),
    sizes,
    colors,
    art,
    featured: bool(body.featured),
    soldOut: bool(body.soldOut),
    published: body.published === undefined ? true : bool(body.published),
  };
}

const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function orderCustomerInput(body) {
  const wilaya = getWilaya(String(body.wilaya || ''));
  if (!wilaya) throw new ValidationError('Wilaya invalide', 'wilaya');
  const delivery = body.delivery === 'desk' ? 'desk' : 'home';
  return {
    name: text(body.name, { field: 'Nom', required: true, min: 2, max: 80 }),
    phone: phone(body.phone),
    email: email(body.email),
    wilaya: wilaya.code,
    address: text(body.address, { field: 'Adresse', required: true, min: 4, max: 200 }),
    delivery,
    note: text(body.note, { field: 'Note', max: 300 }),
    newsletter: bool(body.newsletter),
  };
}

module.exports = {
  ValidationError, ORDER_STATUSES, EMAIL_RE,
  text, email, phone, int, bool, productInput, orderCustomerInput,
};
