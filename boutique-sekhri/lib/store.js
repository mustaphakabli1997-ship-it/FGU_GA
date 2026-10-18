'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { demoProducts } = require('./seed');
const { defaultArt } = require('./catalog');

const NEW_PRODUCT_DAYS = 30;
const id = () => crypto.randomBytes(6).toString('hex');
const token = () => crypto.randomBytes(18).toString('base64url');

const slugify = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'produit';

/**
 * Tiny JSON-file database. The shop is a single process with low write volume,
 * so a synchronous atomic write (tmp file + rename) keeps things simple and safe.
 */
class Store {
  constructor(dataDir, { seedDemo = true } = {}) {
    this.dir = dataDir;
    this.file = path.join(dataDir, 'db.json');
    fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });

    if (fs.existsSync(this.file)) {
      this.db = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } else {
      this.db = { products: [], subscribers: [], orders: [], campaigns: [] };
      if (seedDemo) {
        for (const p of demoProducts()) this.db.products.push(this._withIdentity(p, this.db.products));
      }
      this._save();
    }
    this.db.campaigns ??= [];
    this._interruptStaleCampaigns();
  }

  _save() {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2));
    fs.renameSync(tmp, this.file);
  }

  _withIdentity(product, existing) {
    const base = slugify(product.name);
    let slug = base;
    for (let n = 2; existing.some((p) => p.slug === slug); n += 1) slug = `${base}-${n}`;
    return { id: id(), slug, ...product };
  }

  // ---- products -----------------------------------------------------------

  /** Adds the derived `isNew` flag and the illustration fallback. */
  _present(p) {
    const ageDays = (Date.now() - Date.parse(p.createdAt)) / 864e5;
    return { ...p, isNew: ageDays <= NEW_PRODUCT_DAYS, art: p.art || defaultArt(p.category) };
  }

  listProducts({ includeHidden = false } = {}) {
    return this.db.products
      .filter((p) => includeHidden || p.published)
      .map((p) => this._present(p))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  getProduct(idOrSlug, { includeHidden = false } = {}) {
    const p = this.db.products.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
    return p && (includeHidden || p.published) ? this._present(p) : null;
  }

  createProduct(input, images = []) {
    const product = this._withIdentity(
      { ...input, images, createdAt: new Date().toISOString() },
      this.db.products,
    );
    this.db.products.push(product);
    this._save();
    return this._present(product);
  }

  updateProduct(productId, input, { images } = {}) {
    const p = this.db.products.find((x) => x.id === productId);
    if (!p) return null;
    Object.assign(p, input);
    if (images) p.images = images;
    this._save();
    return this._present(p);
  }

  deleteProduct(productId) {
    const index = this.db.products.findIndex((x) => x.id === productId);
    if (index === -1) return null;
    const [removed] = this.db.products.splice(index, 1);
    this._save();
    return removed;
  }

  // ---- subscribers --------------------------------------------------------

  listSubscribers() {
    return [...this.db.subscribers].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  activeSubscribers() {
    return this.db.subscribers.filter((s) => !s.unsubscribedAt);
  }

  /** Returns { subscriber, created }. Re-subscribing an unsubscribed address reactivates it. */
  addSubscriber({ email, lang, source = 'site' }) {
    lang = lang === 'ar' ? 'ar' : 'fr';
    const existing = this.db.subscribers.find((s) => s.email === email);
    if (existing) {
      const reactivated = Boolean(existing.unsubscribedAt);
      if (reactivated) {
        existing.unsubscribedAt = null;
        existing.lang = lang;
        this._save();
      }
      return { subscriber: existing, created: reactivated };
    }
    const subscriber = {
      id: id(), email, lang, source,
      token: token(), createdAt: new Date().toISOString(), unsubscribedAt: null,
    };
    this.db.subscribers.push(subscriber);
    this._save();
    return { subscriber, created: true };
  }

  findSubscriberByToken(value) {
    return typeof value === 'string' && value
      ? this.db.subscribers.find((s) => s.token === value) || null
      : null;
  }

  unsubscribe(value) {
    const s = this.findSubscriberByToken(value);
    if (!s) return null;
    if (!s.unsubscribedAt) {
      s.unsubscribedAt = new Date().toISOString();
      this._save();
    }
    return s;
  }

  deleteSubscriber(subscriberId) {
    const index = this.db.subscribers.findIndex((s) => s.id === subscriberId);
    if (index === -1) return false;
    this.db.subscribers.splice(index, 1);
    this._save();
    return true;
  }

  // ---- orders -------------------------------------------------------------

  listOrders() {
    return [...this.db.orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  createOrder(order) {
    const day = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    let ref;
    do {
      ref = `SK-${day}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    } while (this.db.orders.some((o) => o.ref === ref));
    const saved = { id: id(), ref, status: 'new', createdAt: new Date().toISOString(), ...order };
    this.db.orders.push(saved);
    this._save();
    return saved;
  }

  setOrderStatus(orderId, status) {
    const o = this.db.orders.find((x) => x.id === orderId);
    if (!o) return null;
    o.status = status;
    this._save();
    return o;
  }

  // ---- newsletter campaigns -----------------------------------------------

  /** A campaign left "running" by a previous process can never finish: flag it. */
  _interruptStaleCampaigns() {
    let changed = false;
    for (const c of this.db.campaigns) {
      if (c.status === 'running' || c.status === 'queued') {
        c.status = 'interrupted';
        c.finishedAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) this._save();
  }

  saveCampaign(campaign) {
    const index = this.db.campaigns.findIndex((c) => c.id === campaign.id);
    if (index === -1) this.db.campaigns.unshift(campaign);
    else this.db.campaigns[index] = campaign;
    this.db.campaigns.length = Math.min(this.db.campaigns.length, 25);
    this._save();
    return campaign;
  }

  listCampaigns() {
    return this.db.campaigns;
  }
}

module.exports = { Store, slugify, newId: id };
