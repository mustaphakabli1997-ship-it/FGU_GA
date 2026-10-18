'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const { CATEGORIES, ART_KINDS, SIZES } = require('./lib/catalog');
const { WILAYAS } = require('./lib/wilayas');
const { createAuth } = require('./lib/auth');
const { createLimiter } = require('./lib/ratelimit');
const { newId } = require('./lib/store');
const { esc } = require('./lib/emails');
const v = require('./lib/validate');

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

/** Checks the real file signature, not just the (client supplied) mime type. */
function looksLikeImage(file) {
  const fd = fs.openSync(file.path, 'r');
  const head = Buffer.alloc(12);
  fs.readSync(fd, head, 0, 12, 0);
  fs.closeSync(fd);
  if (file.mimetype === 'image/jpeg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (file.mimetype === 'image/png') return head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (file.mimetype === 'image/webp') return head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP';
  return false;
}

function createApp({ config, store, mailer, log = console }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  const auth = createAuth({
    password: config.adminPassword,
    secret: config.sessionSecret,
    secureCookie: config.siteUrl.startsWith('https://'),
  });
  const uploadsDir = path.join(config.dataDir, 'uploads');

  const loginLimit = createLimiter({ windowMs: 15 * 60_000, max: 8 });
  const subscribeLimit = createLimiter({ windowMs: 60 * 60_000, max: 12 });
  const orderLimit = createLimiter({ windowMs: 60 * 60_000, max: 20 });
  const tooMany = (res) => res.status(429).json({ error: 'Trop de tentatives, réessayez plus tard.' });

  // ---- security headers ---------------------------------------------------
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': [
        "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:", "font-src 'self'", "connect-src 'self'",
        "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    next();
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use((req, res, next) => {
    req.body ??= {}; // Express 5 leaves body undefined when nothing was parsed
    next();
  });

  // ---- static files -------------------------------------------------------
  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));
  app.use(express.static(config.publicDir, {
    index: 'index.html',
    setHeaders(res, file) {
      if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache');
      else if (/\/(fonts|assets)\//.test(file)) res.set('Cache-Control', 'public, max-age=604800');
      else res.set('Cache-Control', 'public, max-age=300');
    },
  }));
  app.get('/admin', (req, res) => res.sendFile(path.join(config.publicDir, 'admin.html')));
  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // ---- public API ---------------------------------------------------------
  app.get('/api/config', (req, res) => {
    const contact = Object.fromEntries(Object.entries(config.contact).filter(([, value]) => value));
    res.json({
      currency: config.currency,
      shipping: config.shipping,
      categories: CATEGORIES,
      wilayas: WILAYAS.map(([code, fr, ar]) => ({ code, fr, ar })),
      contact,
    });
  });

  app.get('/api/products', (req, res) => res.json(store.listProducts()));

  app.get('/api/products/:slug', (req, res) => {
    const product = store.getProduct(req.params.slug);
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(product);
  });

  app.post('/api/subscribe', (req, res) => {
    if (!subscribeLimit(req.ip)) return tooMany(res);
    // Honeypot: real visitors never fill the hidden "website" field.
    if (req.body.website) return res.json({ ok: true });
    const email = v.email(req.body.email, { required: true });
    const lang = req.body.lang === 'ar' ? 'ar' : 'fr';
    const source = ['popup', 'footer', 'home', 'checkout'].includes(req.body.source) ? req.body.source : 'site';
    const { subscriber, created } = store.addSubscriber({ email, lang, source });
    if (created) {
      mailer.sendWelcome(subscriber).catch((err) => log.error('[mail] welcome failed:', err.message));
    }
    res.json({ ok: true });
  });

  function buildOrder(body) {
    const customer = v.orderCustomerInput(body.customer || {});
    const raw = Array.isArray(body.items) ? body.items : [];
    if (!raw.length || raw.length > 30) throw new v.ValidationError('Panier invalide', 'items');

    const items = raw.map((line) => {
      const product = store.getProduct(String(line.productId || ''));
      if (!product || product.soldOut) throw new v.ValidationError('Un produit du panier est indisponible', 'items');
      const qty = v.int(line.qty, { field: 'Quantité', min: 1, max: 10 });
      const size = String(line.size || '');
      const color = String(line.color || '');
      if (product.sizes.length && !product.sizes.includes(size)) throw new v.ValidationError('Taille invalide', 'items');
      if (product.colors.length && !product.colors.some((c) => c.name === color)) throw new v.ValidationError('Couleur invalide', 'items');
      return { productId: product.id, slug: product.slug, name: product.name, size, color, qty, price: product.price };
    });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const { home, desk, freeFrom } = config.shipping;
    const shipping = subtotal >= freeFrom ? 0 : customer.delivery === 'desk' ? desk : home;
    return { customer, items, subtotal, shipping, total: subtotal + shipping };
  }

  app.post('/api/orders', (req, res) => {
    if (!orderLimit(req.ip)) return tooMany(res);
    const order = store.createOrder(buildOrder(req.body));
    if (order.customer.newsletter && order.customer.email) {
      const { subscriber, created } = store.addSubscriber({ email: order.customer.email, lang: req.body.lang, source: 'checkout' });
      if (created) mailer.sendWelcome(subscriber).catch((err) => log.error('[mail] welcome failed:', err.message));
    }
    mailer.sendOrderEmails(order).catch((err) => log.error('[mail] order emails failed:', err.message));
    res.status(201).json({ ref: order.ref, subtotal: order.subtotal, shipping: order.shipping, total: order.total });
  });

  // ---- unsubscribe (linked from every newsletter email) -------------------
  const unsubPage = ({ lang, title, text, token }) => {
    const rtl = lang === 'ar';
    const button = rtl ? 'تأكيد إلغاء الاشتراك' : 'Confirmer le désabonnement';
    return `<!doctype html><html lang="${rtl ? 'ar' : 'fr'}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Boutique Sekhri</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:Mont;src:url(/fonts/montserrat-latin.woff2) format('woff2');font-weight:400 900}
@font-face{font-family:Cairo;src:url(/fonts/cairo-arabic.woff2) format('woff2');font-weight:400 900}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0c;color:#f3f3f4;font-family:${rtl ? 'Cairo' : 'Mont'},system-ui,sans-serif;padding:24px}
main{max-width:460px;text-align:center}img{width:200px;max-width:70%}h1{font-size:26px;margin:28px 0 10px}
p{color:#a3a3aa;line-height:1.7;margin:0 0 26px}
button,a.btn{display:inline-block;background:#ff4d00;color:#fff;border:0;border-radius:4px;padding:14px 28px;font:700 14px inherit;font-family:inherit;letter-spacing:.08em;cursor:pointer;text-decoration:none}
</style></head><body><main><img src="/assets/logo-email.png" alt="Boutique Sekhri"><h1>${esc(title)}</h1><p>${esc(text)}</p>
${token
    ? `<form method="post" action="/unsubscribe"><input type="hidden" name="t" value="${esc(token)}"><button type="submit">${button}</button></form>`
    : `<a class="btn" href="/">${rtl ? 'العودة إلى المتجر' : 'Retour à la boutique'}</a>`}
</main></body></html>`;
  };

  app.get('/unsubscribe', (req, res) => {
    const sub = store.findSubscriberByToken(String(req.query.t || ''));
    if (!sub) {
      return res.status(404).send(unsubPage({ lang: 'fr', title: 'Lien invalide', text: "Ce lien de désabonnement n'est pas valide." }));
    }
    const ar = sub.lang === 'ar';
    res.send(unsubPage({
      lang: sub.lang,
      title: ar ? 'إلغاء الاشتراك' : 'Se désabonner',
      text: ar ? `هل تريد التوقف عن استلام رسائلنا على ${sub.email}؟` : `Ne plus recevoir nos emails sur ${sub.email} ?`,
      token: sub.token,
    }));
  });

  app.post('/unsubscribe', (req, res) => {
    const sub = store.unsubscribe(String(req.query.t || req.body.t || ''));
    if (!sub) return res.status(404).send(unsubPage({ lang: 'fr', title: 'Lien invalide', text: "Ce lien de désabonnement n'est pas valide." }));
    const ar = sub.lang === 'ar';
    res.send(unsubPage({
      lang: sub.lang,
      title: ar ? 'تم إلغاء الاشتراك' : 'Vous êtes désabonné(e)',
      text: ar ? 'لن تصلك رسائلنا بعد الآن. يمكنك الاشتراك من جديد في أي وقت.' : 'Vous ne recevrez plus nos emails. Vous pouvez vous réinscrire à tout moment.',
    }));
  });

  // ---- admin API ----------------------------------------------------------
  const admin = express.Router();

  admin.get('/session', (req, res) => res.json({ authenticated: auth.isAuthenticated(req) }));

  admin.post('/login', (req, res) => {
    if (!loginLimit(req.ip)) return tooMany(res);
    if (!auth.checkPassword(req.body.password)) return res.status(401).json({ error: 'Mot de passe incorrect' });
    res.set('Set-Cookie', auth.cookieFor()).json({ authenticated: true });
  });

  admin.post('/logout', (req, res) => res.set('Set-Cookie', auth.clearCookie()).json({ authenticated: false }));

  // everything below requires a valid session (+ same-origin for state changes)
  admin.use((req, res, next) => {
    if (!auth.isAuthenticated(req)) return res.status(401).json({ error: 'Non autorisé' });
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin) {
      let sameOrigin = false;
      try { sameOrigin = new URL(req.headers.origin).host === req.headers.host; } catch { /* malformed */ }
      if (!sameOrigin) return res.status(403).json({ error: 'Origine refusée' });
    }
    next();
  });

  admin.get('/meta', (req, res) => res.json({
    categories: CATEGORIES, artKinds: ART_KINDS, sizes: SIZES, mail: mailer.status(),
    orderStatuses: v.ORDER_STATUSES, siteUrl: config.siteUrl,
  }));

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (req, file, cb) => cb(null, `${newId()}${IMAGE_TYPES[file.mimetype] || ''}`),
    }),
    limits: { fileSize: 8 * 1024 * 1024, files: 8 },
    fileFilter: (req, file, cb) => cb(
      IMAGE_TYPES[file.mimetype] ? null : new v.ValidationError('Format image non supporté (JPG, PNG ou WebP)', 'images'),
      Boolean(IMAGE_TYPES[file.mimetype]),
    ),
  });

  const removeFiles = (urls) => {
    for (const url of urls) {
      fs.rmSync(path.join(uploadsDir, path.basename(url)), { force: true });
    }
  };

  /** Parses the multipart form, validates it, and validates every uploaded file signature. */
  const parseProductForm = (req, res, next) => {
    upload.array('images', 8)(req, res, (err) => {
      if (err) {
        removeFiles((req.files || []).map((f) => f.filename));
        return next(err instanceof multer.MulterError ? new v.ValidationError('Image trop lourde (8 Mo max)', 'images') : err);
      }
      const bad = (req.files || []).find((f) => !looksLikeImage(f));
      if (bad) {
        removeFiles(req.files.map((f) => f.filename));
        return next(new v.ValidationError('Fichier image invalide', 'images'));
      }
      next();
    });
  };

  admin.get('/products', (req, res) => res.json(store.listProducts({ includeHidden: true })));

  admin.post('/products', parseProductForm, (req, res) => {
    let input;
    try {
      input = v.productInput(req.body);
    } catch (err) {
      removeFiles((req.files || []).map((f) => f.filename));
      throw err;
    }
    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const product = store.createProduct(input, images);

    // The whole point: announce every new product to the newsletter list.
    const notify = v.bool(req.body.notify);
    const campaign = notify && product.published ? mailer.queueProductCampaign(product) : null;
    res.status(201).json({ product, campaign });
  });

  admin.put('/products/:id', parseProductForm, (req, res) => {
    const current = store.getProduct(req.params.id, { includeHidden: true });
    const newFiles = (req.files || []).map((f) => f.filename);
    if (!current) {
      removeFiles(newFiles);
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    let input;
    try {
      input = v.productInput(req.body);
    } catch (err) {
      removeFiles(newFiles);
      throw err;
    }
    let requested = [];
    try {
      requested = Array.isArray(req.body.keepImages) ? req.body.keepImages : JSON.parse(req.body.keepImages || '[]');
    } catch {
      removeFiles(newFiles);
      throw new v.ValidationError('Liste des images invalide', 'images');
    }
    const keep = requested.filter((url) => current.images.includes(url));
    const images = [...keep, ...newFiles.map((name) => `/uploads/${name}`)];
    removeFiles(current.images.filter((url) => !keep.includes(url)));
    res.json({ product: store.updateProduct(current.id, input, { images }) });
  });

  admin.delete('/products/:id', (req, res) => {
    const removed = store.deleteProduct(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Produit introuvable' });
    removeFiles(removed.images || []);
    res.json({ ok: true });
  });

  admin.post('/products/:id/notify', (req, res) => {
    const product = store.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit introuvable ou masqué' });
    res.json({ campaign: mailer.queueProductCampaign(product) });
  });

  admin.get('/campaigns', (req, res) => res.json(store.listCampaigns()));

  admin.post('/mail/test', async (req, res) => {
    const to = v.email(req.body.email, { required: true });
    const info = await mailer.sendTest(to, req.body.lang === 'ar' ? 'ar' : 'fr');
    res.json({ ok: true, mode: mailer.mode, preview: info.preview ? path.basename(info.preview) : null });
  });

  admin.get('/outbox', (req, res) => res.json(mailer.listPreviews()));

  admin.get('/outbox/:file', (req, res) => {
    const file = mailer.previewPath(req.params.file);
    if (!file || !fs.existsSync(file)) return res.status(404).json({ error: 'Introuvable' });
    res.sendFile(file);
  });

  admin.get('/subscribers', (req, res) => res.json(store.listSubscribers().map(({ token, ...rest }) => rest)));

  admin.get('/subscribers.csv', (req, res) => {
    // Neutralise spreadsheet formula injection in user-supplied cells.
    const cell = (value) => {
      const s = String(value ?? '');
      return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
    };
    const rows = [['email', 'langue', 'source', 'inscrit_le', 'desinscrit_le']].concat(
      store.listSubscribers().map((s) => [s.email, s.lang, s.source, s.createdAt, s.unsubscribedAt || '']),
    );
    res.type('text/csv; charset=utf-8')
      .set('Content-Disposition', 'attachment; filename="abonnes-sekhri.csv"')
      .send(`﻿${rows.map((r) => r.map(cell).join(',')).join('\r\n')}`);
  });

  admin.delete('/subscribers/:id', (req, res) => {
    if (!store.deleteSubscriber(req.params.id)) return res.status(404).json({ error: 'Abonné introuvable' });
    res.json({ ok: true });
  });

  admin.get('/orders', (req, res) => res.json(store.listOrders()));

  admin.patch('/orders/:id', (req, res) => {
    if (!v.ORDER_STATUSES.includes(req.body.status)) throw new v.ValidationError('Statut invalide', 'status');
    const order = store.setOrderStatus(req.params.id, req.body.status);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    res.json(order);
  });

  app.use('/api/admin', admin);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Introuvable' }));

  // ---- errors -------------------------------------------------------------
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof v.ValidationError) return res.status(400).json({ error: err.message, field: err.field });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Requête invalide' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Requête trop volumineuse' });
    log.error('[server]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  });

  return app;
}

module.exports = { createApp };
