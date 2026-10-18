'use strict';
const crypto = require('crypto');
const config = require('./lib/config');
const { Store } = require('./lib/store');
const { Mailer } = require('./lib/mailer');
const { createApp } = require('./app');

if (!config.adminPassword) {
  if (config.isProd) {
    console.error('ADMIN_PASSWORD is required when NODE_ENV=production (see .env.example).');
    process.exit(1);
  }
  config.adminPassword = crypto.randomBytes(9).toString('base64url');
  console.warn(`\n  ADMIN_PASSWORD not set — temporary admin password for this run: ${config.adminPassword}\n`);
}

const store = new Store(config.dataDir, { seedDemo: config.seedDemo });
const mailer = new Mailer({ config, store });
const app = createApp({ config, store, mailer });

const server = app.listen(config.port, () => {
  console.log(`Boutique Sekhri     ${config.siteUrl}`);
  console.log(`Admin               ${config.siteUrl}/admin`);
  console.log(
    mailer.mode === 'smtp'
      ? `Emails              SMTP ${config.mail.host}:${config.mail.port}`
      : `Emails              preview mode (no SMTP_HOST) — messages are saved in ${mailer.outboxDir}`,
  );
});

// Let a running newsletter campaign finish before the process exits.
const shutdown = () => {
  server.close();
  mailer.idle().finally(() => process.exit(0));
  setTimeout(() => process.exit(0), 15_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
