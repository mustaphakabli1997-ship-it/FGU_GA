'use strict';
const path = require('path');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  /* no .env file: rely on the real environment */
}

const env = process.env;
const num = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const str = (value) => (value || '').trim();

const port = num(env.PORT, 3000);

module.exports = {
  port,
  isProd: env.NODE_ENV === 'production',
  // Set TRUST_PROXY=1 when running behind nginx/Cloudflare so rate limits see the real client IP.
  trustProxy: env.TRUST_PROXY ? (Number.isNaN(Number(env.TRUST_PROXY)) ? env.TRUST_PROXY : Number(env.TRUST_PROXY)) : false,
  siteUrl: (str(env.SITE_URL) || `http://localhost:${port}`).replace(/\/+$/, ''),
  dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(__dirname, '..', 'data'),
  publicDir: path.join(__dirname, '..', 'public'),

  seedDemo: env.SEED_DEMO !== 'false',

  adminPassword: str(env.ADMIN_PASSWORD),
  sessionSecret: str(env.SESSION_SECRET),

  currency: 'DA',
  shipping: {
    home: num(env.SHIPPING_HOME, 700),
    desk: num(env.SHIPPING_DESK, 450),
    freeFrom: num(env.FREE_SHIPPING_FROM, 15000),
  },

  contact: {
    whatsapp: str(env.CONTACT_WHATSAPP).replace(/[^\d]/g, ''),
    instagram: str(env.CONTACT_INSTAGRAM).replace(/^@/, ''),
    facebook: str(env.CONTACT_FACEBOOK),
    tiktok: str(env.CONTACT_TIKTOK).replace(/^@/, ''),
    phone: str(env.CONTACT_PHONE),
    email: str(env.CONTACT_EMAIL),
    address: str(env.CONTACT_ADDRESS),
  },

  mail: {
    host: str(env.SMTP_HOST),
    port: num(env.SMTP_PORT, 587),
    secure: env.SMTP_SECURE === 'true',
    user: str(env.SMTP_USER),
    pass: env.SMTP_PASS || '',
    from: str(env.MAIL_FROM) || 'Boutique Sekhri <no-reply@localhost>',
    ownerEmail: str(env.OWNER_EMAIL),
    delayMs: num(env.MAIL_DELAY_MS, 400),
  },
};
