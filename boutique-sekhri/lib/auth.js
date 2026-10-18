'use strict';
const crypto = require('crypto');

const COOKIE = 'sk_admin';
const TTL_MS = 12 * 60 * 60 * 1000;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest();
const b64 = (buffer) => buffer.toString('base64url');

/** Stateless signed-cookie admin session; no user table, one shared admin password. */
function createAuth({ password, secret, secureCookie }) {
  const key = sha256(`sekhri-session|${secret || password}`);
  const sign = (payload) => b64(crypto.createHmac('sha256', key).update(payload).digest());

  const readCookie = (header) => {
    for (const part of String(header || '').split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === COOKIE) return rest.join('=');
    }
    return '';
  };

  return {
    checkPassword(input) {
      return typeof input === 'string' && crypto.timingSafeEqual(sha256(input), sha256(password));
    },

    cookieFor() {
      const payload = b64(Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS, n: crypto.randomBytes(8).toString('hex') })));
      return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL_MS / 1000}${secureCookie ? '; Secure' : ''}`;
    },

    clearCookie() {
      return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookie ? '; Secure' : ''}`;
    },

    isAuthenticated(req) {
      const [payload, signature] = readCookie(req.headers.cookie).split('.');
      if (!payload || !signature) return false;
      const expected = Buffer.from(sign(payload));
      const given = Buffer.from(signature);
      if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
      try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
      } catch {
        return false;
      }
    },
  };
}

module.exports = { createAuth };
