'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const baseConfig = require('../lib/config');
const { Store } = require('../lib/store');
const { Mailer } = require('../lib/mailer');
const { createApp } = require('../app');

const PASSWORD = 'test-password-123';
let server; let base; let store; let mailer; let dataDir; let cookie;

const silent = { error() {}, warn() {}, log() {} };
const outbox = () => (fs.existsSync(path.join(dataDir, 'outbox')) ? fs.readdirSync(path.join(dataDir, 'outbox')) : []);
const api = (url, options = {}) => fetch(`${base}${url}`, {
  ...options,
  headers: { ...(options.json ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...options.headers },
  body: options.json ? JSON.stringify(options.json) : options.body,
});

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekhri-test-'));
  const config = {
    ...baseConfig, dataDir, adminPassword: PASSWORD, siteUrl: 'https://sekhri.test',
    mail: { ...baseConfig.mail, host: '', ownerEmail: 'owner@sekhri.test' },
  };
  store = new Store(dataDir, { seedDemo: true });
  mailer = new Mailer({ config, store, log: silent });
  const app = createApp({ config, store, mailer, log: silent });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('catalogue is seeded and exposes every category', async () => {
  const products = await (await api('/api/products')).json();
  assert.ok(products.length >= 20);
  const config = await (await api('/api/config')).json();
  assert.equal(config.wilayas.length, 58);
  for (const c of config.categories) assert.ok(products.some((p) => p.category === c.id), `no product in ${c.id}`);
});

test('subscribing validates the email, stores it once and sends a welcome email with the logo', async () => {
  const bad = await api('/api/subscribe', { method: 'POST', json: { email: 'not-an-email' } });
  assert.equal(bad.status, 400);

  const ok = await api('/api/subscribe', { method: 'POST', json: { email: 'Client@Example.com', lang: 'fr', source: 'popup' } });
  assert.equal(ok.status, 200);
  const again = await api('/api/subscribe', { method: 'POST', json: { email: 'client@example.com' } });
  assert.equal(again.status, 200);
  assert.equal(store.activeSubscribers().length, 1);
  assert.equal(store.activeSubscribers()[0].email, 'client@example.com');

  await mailer.idle();
  await new Promise((r) => setTimeout(r, 50));
  const welcome = outbox().filter((f) => f.endsWith('.eml') && f.includes('client-example-com'));
  assert.equal(welcome.length, 1, 'welcome email written once');
  const eml = fs.readFileSync(path.join(dataDir, 'outbox', welcome[0]), 'utf8');
  assert.match(eml, /Content-ID: <logo@boutique-sekhri>/);
  assert.match(eml, /List-Unsubscribe:/);
});

test('honeypot submissions are ignored', async () => {
  await api('/api/subscribe', { method: 'POST', json: { email: 'bot@example.com', website: 'http://spam' } });
  assert.ok(!store.activeSubscribers().some((s) => s.email === 'bot@example.com'));
});

test('admin routes require a session and reject a wrong password', async () => {
  assert.equal((await api('/api/admin/products')).status, 401);
  const wrong = await api('/api/admin/login', { method: 'POST', json: { password: 'nope' } });
  assert.equal(wrong.status, 401);
  const login = await api('/api/admin/login', { method: 'POST', json: { password: PASSWORD } });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Secure/, 'secure cookie because SITE_URL is https');
  cookie = setCookie.split(';')[0];
  assert.equal((await api('/api/admin/products')).status, 200);
  assert.equal((await api('/api/admin/products', { headers: { cookie: 'sk_admin=forged.value' } })).status, 401);
});

test('a forged cross-origin admin write is refused', async () => {
  const res = await api('/api/admin/logout', { method: 'POST', headers: { origin: 'https://evil.example' } });
  // logout is public by design; a protected write must be refused
  assert.equal(res.status, 200);
  cookie = (await (await api('/api/admin/login', { method: 'POST', json: { password: PASSWORD } })).headers.get('set-cookie')).split(';')[0];
  const del = await api('/api/admin/subscribers/whatever', { method: 'DELETE', headers: { origin: 'https://evil.example' } });
  assert.equal(del.status, 403);
});

test('adding a product emails every active subscriber with the logo and a product link', async () => {
  await api('/api/subscribe', { method: 'POST', json: { email: 'ahmed@example.com', lang: 'ar' } });
  const before = outbox().length;

  const form = new FormData();
  form.set('name', 'Ensemble <script>alert(1)</script> Test');
  form.set('category', 'ensembles');
  form.set('price', '19900');
  form.set('oldPrice', '24900');
  form.set('description', 'Description <b>test</b>');
  form.set('sizes', JSON.stringify(['M', 'L']));
  form.set('colors', JSON.stringify([{ name: 'Noir', hex: '#111111' }]));
  form.set('notify', 'true');
  form.set('featured', 'true');
  // 1x1 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
  form.append('images', new Blob([png], { type: 'image/png' }), 'x.png');

  const res = await api('/api/admin/products', { method: 'POST', body: form });
  assert.equal(res.status, 201);
  const { product, campaign } = await res.json();
  assert.equal(campaign.total, 2);
  assert.match(product.images[0], /^\/uploads\/[0-9a-f]+\.png$/);

  await mailer.idle();
  const files = outbox().slice(before).filter((f) => f.endsWith('.eml'));
  assert.equal(files.length, 2, 'one email per subscriber');

  const arabic = files.find((f) => f.includes('ahmed-example-com'));
  const eml = fs.readFileSync(path.join(dataDir, 'outbox', arabic), 'utf8');
  assert.match(eml, /Content-ID: <logo@boutique-sekhri>/);
  assert.match(eml, /Content-ID: <product@boutique-sekhri>/);

  const html = fs.readFileSync(path.join(dataDir, 'outbox', arabic.replace('.eml', '.html')), 'utf8');
  assert.match(html, /dir="rtl"/);
  assert.ok(!html.includes('<script>alert(1)</script>'), 'product name is escaped');
  assert.match(html, /https:\/\/sekhri\.test\/#\/produit\/ensemble-script-alert-1-script-test/);
  assert.match(html, /\/unsubscribe\?t=/);
  assert.match(html, /-20%/);

  const campaigns = await (await api('/api/admin/campaigns')).json();
  assert.equal(campaigns[0].status, 'done');
  assert.equal(campaigns[0].sent, 2);
});

test('no email is sent when "notify" is off, and unsubscribed users are skipped', async () => {
  const sub = store.activeSubscribers().find((s) => s.email === 'client@example.com');
  const unsub = await api(`/unsubscribe?t=${sub.token}`, { method: 'POST' });
  assert.equal(unsub.status, 200);
  assert.equal(store.activeSubscribers().length, 1);

  const before = outbox().length;
  const quiet = new FormData();
  Object.entries({ name: 'Short silencieux', category: 'shorts', price: '3900', notify: 'false', sizes: '["M"]', colors: '[]' })
    .forEach(([k, val]) => quiet.set(k, val));
  const r1 = await api('/api/admin/products', { method: 'POST', body: quiet });
  assert.equal(r1.status, 201);
  assert.equal((await r1.json()).campaign, null);
  assert.equal(outbox().length, before);

  const loud = new FormData();
  Object.entries({ name: 'Short bruyant', category: 'shorts', price: '3900', notify: 'true', sizes: '["M"]', colors: '[]' })
    .forEach(([k, val]) => loud.set(k, val));
  const r2 = await api('/api/admin/products', { method: 'POST', body: loud });
  assert.equal((await r2.json()).campaign.total, 1, 'only the remaining active subscriber');
  await mailer.idle();
});

test('upload rejects files that are not real images', async () => {
  const form = new FormData();
  Object.entries({ name: 'Faux', category: 'shorts', price: '3900', sizes: '[]', colors: '[]' }).forEach(([k, val]) => form.set(k, val));
  form.append('images', new Blob(['<?php echo 1; ?>'], { type: 'image/png' }), 'evil.png');
  const res = await api('/api/admin/products', { method: 'POST', body: form });
  assert.equal(res.status, 400);
  assert.deepEqual(fs.readdirSync(path.join(dataDir, 'uploads')).length, 1, 'rejected file was removed');
});

test('orders are priced on the server, validated, and notify the owner', async () => {
  const [p1, p2] = (await (await api('/api/products')).json()).filter((p) => p.sizes.length && p.colors.length);
  const customer = { name: 'Karim Test', phone: '0550123456', wilaya: '16', address: '12 rue Didouche Mourad', delivery: 'home' };
  const line = (p, qty = 1) => ({ productId: p.id, size: p.sizes[0], color: p.colors[0].name, qty });
  const before = outbox().length;

  const ok = await api('/api/orders', { method: 'POST', json: { customer, items: [{ ...line(p1, 2), price: 1 }] } });
  assert.equal(ok.status, 201);
  const result = await ok.json();
  assert.equal(result.subtotal, p1.price * 2, 'client-sent price is ignored');
  assert.equal(result.shipping, p1.price * 2 >= 15000 ? 0 : 700);
  assert.match(result.ref, /^SK-\d{6}-[0-9A-F]{4}$/);

  await new Promise((r) => setTimeout(r, 100));
  const mails = outbox().slice(before).filter((f) => f.endsWith('.html'));
  assert.equal(mails.length, 1, 'owner notified (no customer email given)');

  const badPhone = await api('/api/orders', { method: 'POST', json: { customer: { ...customer, phone: '123' }, items: [line(p2)] } });
  assert.equal(badPhone.status, 400);
  const badSize = await api('/api/orders', { method: 'POST', json: { customer, items: [{ ...line(p2), size: 'XXXL' }] } });
  assert.equal(badSize.status, 400);
  const empty = await api('/api/orders', { method: 'POST', json: { customer, items: [] } });
  assert.equal(empty.status, 400);

  const desk = await api('/api/orders', { method: 'POST', json: { customer: { ...customer, delivery: 'desk', phone: '+213 661 23 45 67' }, items: [line(p2)] } });
  assert.equal(desk.status, 201);
  const orders = await (await api('/api/admin/orders')).json();
  assert.equal(orders[0].customer.phone, '0661234567', '+213 numbers are normalised');

  const patched = await api(`/api/admin/orders/${orders[0].id}`, { method: 'PATCH', json: { status: 'confirmed' } });
  assert.equal((await patched.json()).status, 'confirmed');
});

test('subscribers CSV neutralises spreadsheet formulas', async () => {
  store.addSubscriber({ email: '=cmd@example.com', lang: 'fr' });
  const csv = await (await api('/api/admin/subscribers.csv')).text();
  assert.ok(csv.includes('"\'=cmd@example.com"'));
});
