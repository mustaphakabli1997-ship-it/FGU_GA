'use strict';
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const emails = require('./emails');
const { newId } = require('./store');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'assets', 'logo-email.png');
const RASTER = /\.(jpe?g|png|webp|gif)$/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fileSafe = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

/**
 * Sends the shop's emails. With SMTP_HOST set it delivers for real; without it
 * ("preview" mode) every message is written to data/outbox as .html and .eml so
 * the design can be checked without any mail account.
 */
class Mailer {
  constructor({ config, store, log = console }) {
    this.config = config;
    this.store = store;
    this.log = log;
    this.outboxDir = path.join(config.dataDir, 'outbox');
    this.queue = Promise.resolve();

    const { mail } = config;
    this.mode = mail.host ? 'smtp' : 'preview';
    this.transport = mail.host
      ? nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.secure,
        pool: true,
        maxConnections: 2,
        auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
      })
      : null;
    this.raw = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  }

  status() {
    return {
      mode: this.mode,
      host: this.config.mail.host || null,
      from: this.config.mail.from,
      ownerEmail: this.config.mail.ownerEmail || null,
      outbox: this.mode === 'preview' ? this.outboxDir : null,
    };
  }

  /** Newest saved preview emails (preview mode only). */
  listPreviews(limit = 30) {
    if (!fs.existsSync(this.outboxDir)) return [];
    return fs.readdirSync(this.outboxDir)
      .filter((f) => f.endsWith('.html'))
      .sort()
      .reverse()
      .slice(0, limit);
  }

  previewPath(file) {
    return /^[\w.-]+\.html$/.test(file) ? path.join(this.outboxDir, file) : null;
  }

  _attachments(extra = []) {
    return [{ filename: 'logo.png', path: LOGO_PATH, cid: emails.LOGO_CID }, ...extra];
  }

  _productAttachment(product) {
    const file = (product.images || []).map((url) => path.basename(url)).find((name) => RASTER.test(name));
    if (!file) return null;
    const full = path.join(this.config.dataDir, 'uploads', file);
    return fs.existsSync(full) ? { filename: file, path: full, cid: emails.PRODUCT_CID } : null;
  }

  /** Low-level send. `message` = { to, subject, html, text, attachments, unsubscribeUrl }. */
  async send({ to, subject, html, text, attachments = [], unsubscribeUrl }) {
    const message = {
      from: this.config.mail.from,
      to,
      subject,
      html,
      text,
      attachments: this._attachments(attachments),
      headers: unsubscribeUrl
        ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
        : undefined,
    };

    if (this.transport) return this.transport.sendMail(message);

    // Preview mode: keep a browsable copy (images inlined) and the raw .eml.
    fs.mkdirSync(this.outboxDir, { recursive: true });
    const stamp = `${new Date().toISOString().replace(/[:.]/g, '-')}-${newId().slice(0, 4)}`;
    const base = path.join(this.outboxDir, `${stamp}-${fileSafe(to)}-${fileSafe(subject)}`);
    let preview = html;
    for (const a of message.attachments) {
      const mime = a.filename.endsWith('.png') ? 'image/png' : a.filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      preview = preview.replaceAll(`cid:${a.cid}`, `data:${mime};base64,${fs.readFileSync(a.path).toString('base64')}`);
    }
    fs.writeFileSync(`${base}.html`, preview);
    const info = await this.raw.sendMail(message);
    fs.writeFileSync(`${base}.eml`, info.message);
    return { preview: `${base}.html` };
  }

  async sendWelcome(subscriber) {
    const mail = emails.welcomeEmail({ subscriber, siteUrl: this.config.siteUrl });
    return this.send({ to: subscriber.email, ...mail });
  }

  async sendTest(to, lang = 'fr') {
    return this.send({ to, ...emails.testEmail({ lang, siteUrl: this.config.siteUrl }) });
  }

  async sendOrderEmails(order) {
    const { siteUrl, mail } = this.config;
    const jobs = [];
    if (mail.ownerEmail) jobs.push(this.send({ to: mail.ownerEmail, ...emails.orderOwnerEmail({ order, siteUrl }) }));
    if (order.customer.email) jobs.push(this.send({ to: order.customer.email, ...emails.orderCustomerEmail({ order, siteUrl }) }));
    const results = await Promise.allSettled(jobs);
    for (const r of results) if (r.status === 'rejected') this.log.error('[mail] order email failed:', r.reason?.message);
  }

  /**
   * Queues one email per active subscriber announcing `product`, sent in the
   * background (one at a time, paced by MAIL_DELAY_MS). Returns the campaign
   * record immediately; its progress is persisted and shown in the admin panel.
   */
  queueProductCampaign(product) {
    const recipients = this.store.activeSubscribers().map((s) => ({ ...s }));
    const campaign = {
      id: newId(),
      productId: product.id,
      productName: product.name,
      mode: this.mode,
      status: recipients.length ? 'queued' : 'done',
      total: recipients.length,
      sent: 0,
      failed: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
      finishedAt: recipients.length ? null : new Date().toISOString(),
    };
    this.store.saveCampaign(campaign);
    if (!recipients.length) return campaign;

    this.queue = this.queue.then(() => this._runCampaign(campaign, product, recipients)).catch((err) => {
      this.log.error('[mail] campaign crashed:', err);
    });
    return campaign;
  }

  async _runCampaign(campaign, product, recipients) {
    campaign.status = 'running';
    this.store.saveCampaign(campaign);
    const productAttachment = this._productAttachment(product);
    const delay = this.mode === 'smtp' ? this.config.mail.delayMs : 0;

    for (const subscriber of recipients) {
      // Skip anyone who unsubscribed (or was removed) while the campaign was waiting.
      const current = this.store.findSubscriberByToken(subscriber.token);
      if (!current || current.unsubscribedAt) {
        campaign.total -= 1;
        continue;
      }
      try {
        const mail = emails.productEmail({
          product, subscriber: current, siteUrl: this.config.siteUrl, hasImage: Boolean(productAttachment),
        });
        await this.send({ to: current.email, ...mail, attachments: productAttachment ? [productAttachment] : [] });
        campaign.sent += 1;
      } catch (err) {
        campaign.failed += 1;
        campaign.lastError = String(err.message || err).slice(0, 200);
        this.log.error(`[mail] failed for ${current.email}:`, campaign.lastError);
      }
      // `campaign` is the live object held by the store, so the admin panel sees
      // progress immediately; only persist to disk every few messages.
      if ((campaign.sent + campaign.failed) % 10 === 0) this.store.saveCampaign(campaign);
      if (delay) await sleep(delay);
    }

    campaign.status = 'done';
    campaign.finishedAt = new Date().toISOString();
    this.store.saveCampaign(campaign);
  }

  /** Resolves once every queued campaign has finished (used by tests and graceful shutdown). */
  idle() {
    return this.queue;
  }
}

module.exports = { Mailer };
