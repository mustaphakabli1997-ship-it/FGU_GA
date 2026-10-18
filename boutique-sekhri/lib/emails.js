'use strict';
const { CATEGORIES } = require('./catalog');
const { getWilaya } = require('./wilayas');

const LOGO_CID = 'logo@boutique-sekhri';
const PRODUCT_CID = 'product@boutique-sekhri';

const COLORS = {
  bg: '#0b0b0c', card: '#151517', line: '#26262a', text: '#f3f3f4',
  muted: '#9b9ba1', orange: '#ff4d00', silver: '#c9ccd1',
};

const STRINGS = {
  fr: {
    dir: 'ltr',
    font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    badgeNew: 'NOUVEAUTÉ',
    subjectNew: (name) => `Nouveau chez Boutique Sekhri : ${name}`,
    preheaderNew: (name, price) => `${name} vient d'arriver — ${price}`,
    cta: 'Découvrir la pièce',
    sizes: 'Tailles',
    colors: 'Couleurs',
    soldOut: 'Épuisé',
    footer: 'Vous recevez cet email car vous êtes inscrit(e) à la newsletter Boutique Sekhri.',
    unsubscribe: 'Se désabonner',
    welcomeSubject: 'Bienvenue dans le Club Sekhri',
    welcomePreheader: 'Tu seras le premier informé à chaque nouveau produit.',
    welcomeBadge: 'CLUB SEKHRI',
    welcomeTitle: 'Bienvenue dans le Club.',
    welcomeText: "Tu seras le premier informé à chaque nouveau produit : ensembles, tricots, joggers, shorts… Rien ne t'échappe.",
    welcomeCta: 'Voir la boutique',
    testSubject: 'Test email — Boutique Sekhri',
    testTitle: "L'envoi d'emails fonctionne.",
    testText: "Ceci est un message de test envoyé depuis le panneau d'administration. Si tu le lis, tes abonnés recevront bien leurs emails.",
    orderCustomerSubject: (ref) => `Commande ${ref} reçue — Boutique Sekhri`,
    orderBadge: 'COMMANDE REÇUE',
    orderTitle: (name) => `Merci ${name} !`,
    orderText: 'Nous avons bien reçu ta commande. Nous te contactons par téléphone pour la confirmer avant la livraison.',
    orderRef: 'Référence',
    orderTotal: 'Total à payer à la livraison',
    orderShipping: 'Livraison',
    free: 'Gratuite',
    qty: 'Qté',
  },
  ar: {
    dir: 'rtl',
    font: "Tahoma, 'Segoe UI', Arial, sans-serif",
    badgeNew: 'وصل حديثاً',
    subjectNew: (name) => `جديد Boutique Sekhri: ${name}`,
    preheaderNew: (name, price) => `${name} وصل الآن — ${price}`,
    cta: 'اكتشف المنتج',
    sizes: 'المقاسات',
    colors: 'الألوان',
    soldOut: 'نفد المخزون',
    footer: 'وصلتك هذه الرسالة لأنك مشترك في نشرة Boutique Sekhri.',
    unsubscribe: 'إلغاء الاشتراك',
    welcomeSubject: 'مرحباً بك في نادي Sekhri',
    welcomePreheader: 'ستكون أول من يعلم عند إضافة أي منتج جديد.',
    welcomeBadge: 'نادي SEKHRI',
    welcomeTitle: 'مرحباً بك في النادي.',
    welcomeText: 'ستكون أول من يعلم عند إضافة أي منتج جديد: أطقم، تريكو، سراويل، شورتات… ولن يفوتك شيء.',
    welcomeCta: 'زيارة المتجر',
    testSubject: 'رسالة تجريبية — Boutique Sekhri',
    testTitle: 'إرسال الإيميلات يعمل.',
    testText: 'هذه رسالة تجريبية من لوحة التحكم. إذا وصلتك فسيصل مشتركيك أيضاً.',
    orderCustomerSubject: (ref) => `تم استلام طلبك ${ref} — Boutique Sekhri`,
    orderBadge: 'تم استلام الطلب',
    orderTitle: (name) => `شكراً ${name}!`,
    orderText: 'استلمنا طلبك بنجاح. سنتصل بك هاتفياً لتأكيده قبل التوصيل.',
    orderRef: 'رقم الطلب',
    orderTotal: 'المبلغ عند الاستلام',
    orderShipping: 'التوصيل',
    free: 'مجاني',
    qty: 'الكمية',
  },
};

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Numbers must keep their own direction inside right-to-left (Arabic) emails.
const ltr = (value) => `<bdi dir="ltr" style="unicode-bidi:isolate;">${esc(value)}</bdi>`;
const oneLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
const money = (n, lang = 'fr') => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')} ${lang === 'ar' ? 'دج' : 'DA'}`;
const strings = (lang) => STRINGS[lang === 'ar' ? 'ar' : 'fr'];

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
    <tr><td style="background:${COLORS.orange};border-radius:4px;">
      <a href="${esc(href)}" style="display:inline-block;padding:16px 34px;font-family:inherit;font-size:14px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${esc(label)} &rarr;</a>
    </td></tr>
  </table>`;

/** Shared dark layout: logo header, orange rule, content, unsubscribe footer. */
function shell({ lang, preheader, body, unsubscribeUrl, siteUrl }) {
  const s = strings(lang);
  const align = s.dir === 'rtl' ? 'right' : 'left';
  return `<!doctype html>
<html lang="${lang === 'ar' ? 'ar' : 'fr'}" dir="${s.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Boutique Sekhri</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLORS.bg};">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${COLORS.card};border:1px solid ${COLORS.line};font-family:${s.font};color:${COLORS.text};">
    <tr><td align="center" style="padding:30px 24px 22px;background:${COLORS.bg};">
      <a href="${esc(siteUrl)}" style="text-decoration:none;"><img src="cid:${LOGO_CID}" width="260" alt="Boutique Sekhri — Luxury Sportswear" style="display:block;width:260px;max-width:100%;height:auto;border:0;"></a>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${COLORS.orange};">&nbsp;</td></tr>
    <tr><td dir="${s.dir}" style="padding:36px 36px 40px;text-align:${align};">${body}</td></tr>
    <tr><td dir="${s.dir}" style="padding:22px 36px 30px;border-top:1px solid ${COLORS.line};text-align:${align};font-size:12px;line-height:1.7;color:${COLORS.muted};">
      ${esc(s.footer)}${unsubscribeUrl ? `<br><a href="${esc(unsubscribeUrl)}" style="color:${COLORS.silver};text-decoration:underline;">${esc(s.unsubscribe)}</a>` : ''}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

const badge = (label) =>
  `<div style="font-size:12px;font-weight:800;letter-spacing:.28em;color:${COLORS.orange};margin:0 0 14px;">${esc(label)}</div>`;

const heading = (value) =>
  `<h1 style="margin:0 0 18px;font-size:30px;line-height:1.15;font-weight:800;color:${COLORS.text};">${esc(value)}</h1>`;

const paragraph = (value) =>
  `<p style="margin:0;font-size:15px;line-height:1.75;color:#d4d4d8;">${esc(value)}</p>`;

function productVisual(product, hasImage, lang) {
  if (hasImage) {
    return `<img src="cid:${PRODUCT_CID}" width="528" alt="${esc(product.name)}" style="display:block;width:100%;max-width:528px;height:auto;border:0;margin:0 0 28px;">`;
  }
  // No raster photo: a branded panel in the product's first colour instead.
  const cat = CATEGORIES.find((c) => c.id === product.category);
  const tint = product.colors?.[0]?.hex || '#17181a';
  const label = lang === 'ar' ? cat?.ar : (cat?.fr || '').toUpperCase();
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;background:${COLORS.bg};border-${lang === 'ar' ? 'right' : 'left'}:6px solid ${COLORS.orange};">
    <tr><td style="padding:46px 28px;">
      <div style="font-size:34px;line-height:1.15;font-weight:800;letter-spacing:${lang === 'ar' ? '0' : '.06em'};color:${COLORS.text};">${esc(label || '')}</div>
      <div style="margin-top:18px;width:64px;height:6px;background:${tint.toLowerCase() === '#17181a' ? COLORS.silver : tint};"></div>
    </td></tr></table>`;
}

function productEmail({ product, subscriber, siteUrl, hasImage = false }) {
  const lang = subscriber.lang === 'ar' ? 'ar' : 'fr';
  const s = strings(lang);
  const url = `${siteUrl}/#/produit/${encodeURIComponent(product.slug)}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?t=${encodeURIComponent(subscriber.token)}`;
  const price = money(product.price, lang);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const description = product.description.length > 220
    ? `${product.description.slice(0, 217).trimEnd()}…`
    : product.description;

  const meta = [];
  if (product.sizes?.length) meta.push([s.sizes, product.sizes.join(' · ')]);
  if (product.colors?.length) meta.push([s.colors, product.colors.map((c) => c.name).join(' · ')]);

  const body = `
    ${badge(s.badgeNew)}
    ${productVisual(product, hasImage, lang)}
    ${heading(product.name)}
    <div style="margin:0 0 18px;font-size:22px;font-weight:800;color:${COLORS.orange};">
      ${ltr(price)}
      ${product.oldPrice ? `<span style="font-size:15px;font-weight:500;color:${COLORS.muted};text-decoration:line-through;margin:0 8px;">${ltr(money(product.oldPrice, lang))}</span><span style="font-size:12px;font-weight:800;background:${COLORS.orange};color:#fff;padding:3px 7px;border-radius:3px;">${ltr(`-${discount}%`)}</span>` : ''}
    </div>
    ${description ? paragraph(description) : ''}
    ${meta.length ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px -14px 0;font-size:13px;line-height:1.6;">${meta
      .map(([k, v]) => `<tr><td style="padding:3px 14px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:.14em;font-size:11px;">${esc(k)}</td><td style="padding:3px 14px;color:${COLORS.text};">${esc(v)}</td></tr>`)
      .join('')}</table>` : ''}
    ${product.soldOut ? '' : button(url, s.cta)}`;

  const text = [
    s.badgeNew, '', product.name, price, '', description, '',
    ...meta.map(([k, v]) => `${k}: ${v}`), '', `${s.cta}: ${url}`, '', s.footer, `${s.unsubscribe}: ${unsubscribeUrl}`,
  ].join('\n');

  return {
    subject: oneLine(s.subjectNew(product.name)),
    html: shell({ lang, preheader: s.preheaderNew(product.name, price), body, unsubscribeUrl, siteUrl }),
    text,
    unsubscribeUrl,
  };
}

function welcomeEmail({ subscriber, siteUrl }) {
  const lang = subscriber.lang === 'ar' ? 'ar' : 'fr';
  const s = strings(lang);
  const unsubscribeUrl = `${siteUrl}/unsubscribe?t=${encodeURIComponent(subscriber.token)}`;
  const body = `${badge(s.welcomeBadge)}${heading(s.welcomeTitle)}${paragraph(s.welcomeText)}${button(siteUrl, s.welcomeCta)}`;
  return {
    subject: s.welcomeSubject,
    html: shell({ lang, preheader: s.welcomePreheader, body, unsubscribeUrl, siteUrl }),
    text: `${s.welcomeTitle}\n\n${s.welcomeText}\n\n${siteUrl}\n\n${s.unsubscribe}: ${unsubscribeUrl}`,
    unsubscribeUrl,
  };
}

function testEmail({ lang = 'fr', siteUrl }) {
  const s = strings(lang);
  const body = `${badge('TEST')}${heading(s.testTitle)}${paragraph(s.testText)}`;
  return {
    subject: s.testSubject,
    html: shell({ lang, preheader: s.testTitle, body, siteUrl }),
    text: `${s.testTitle}\n\n${s.testText}`,
  };
}

function orderLines(order, lang) {
  return order.items
    .map((i) => `${i.qty} × ${i.name}${i.size ? ` (${i.size}` : ''}${i.color ? `${i.size ? ', ' : ' ('}${i.color}` : ''}${i.size || i.color ? ')' : ''} — ${money(i.price * i.qty, lang)}`);
}

/** Order summary table (customer confirmation). */
function orderCustomerEmail({ order, siteUrl }) {
  const lang = 'fr';
  const s = strings(lang);
  const rows = order.items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.text};">${esc(i.name)}<br><span style="font-size:12px;color:${COLORS.muted};">${esc([i.size, i.color].filter(Boolean).join(' · '))} &nbsp;${esc(s.qty)} ${i.qty}</span></td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.text};white-space:nowrap;">${esc(money(i.price * i.qty, lang))}</td>
    </tr>`).join('');
  const body = `${badge(s.orderBadge)}${heading(s.orderTitle(order.customer.name.split(' ')[0]))}${paragraph(s.orderText)}
    <p style="margin:22px 0 6px;font-size:12px;letter-spacing:.2em;color:${COLORS.muted};">${esc(s.orderRef.toUpperCase())}</p>
    <p style="margin:0 0 18px;font-size:20px;font-weight:800;color:${COLORS.orange};">${esc(order.ref)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
      <tr><td style="padding:10px 0;font-size:13px;color:${COLORS.muted};">${esc(s.orderShipping)}</td><td align="right" style="padding:10px 0;font-size:13px;color:${COLORS.muted};">${order.shipping ? esc(money(order.shipping, lang)) : esc(s.free)}</td></tr>
      <tr><td style="padding:14px 0 0;font-size:15px;font-weight:800;color:${COLORS.text};">${esc(s.orderTotal)}</td><td align="right" style="padding:14px 0 0;font-size:18px;font-weight:800;color:${COLORS.orange};">${esc(money(order.total, lang))}</td></tr>
    </table>`;
  return {
    subject: s.orderCustomerSubject(order.ref),
    html: shell({ lang, preheader: s.orderText, body, siteUrl }),
    text: [s.orderTitle(order.customer.name), '', s.orderText, '', `${s.orderRef}: ${order.ref}`, '', ...orderLines(order, lang), '',
      `${s.orderShipping}: ${order.shipping ? money(order.shipping, lang) : s.free}`, `${s.orderTotal}: ${money(order.total, lang)}`].join('\n'),
  };
}

/** Internal notification for the shop owner (always French). */
function orderOwnerEmail({ order, siteUrl }) {
  const lang = 'fr';
  const w = getWilaya(order.customer.wilaya);
  const delivery = order.customer.delivery === 'desk' ? 'Point relais / bureau' : 'À domicile';
  const lines = orderLines(order, lang);
  const text = [
    `Nouvelle commande ${order.ref}`, '',
    `Client : ${order.customer.name}`, `Téléphone : ${order.customer.phone}`,
    order.customer.email ? `Email : ${order.customer.email}` : null,
    `Wilaya : ${w ? `${w.code} ${w.fr}` : order.customer.wilaya}`, `Adresse : ${order.customer.address}`,
    `Livraison : ${delivery}`, order.customer.note ? `Note : ${order.customer.note}` : null, '',
    ...lines, '', `Livraison : ${order.shipping ? money(order.shipping, lang) : 'Gratuite'}`,
    `TOTAL À ENCAISSER : ${money(order.total, lang)}`, '', `Admin : ${siteUrl}/admin`,
  ].filter((l) => l !== null).join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;">
    <h2 style="margin:0 0 12px;">Nouvelle commande <span style="color:#ff4d00;">${esc(order.ref)}</span></h2>
    <p style="margin:0 0 12px;"><b>${esc(order.customer.name)}</b> — ${esc(order.customer.phone)}<br>${esc(w ? `${w.code} ${w.fr}` : '')}, ${esc(order.customer.address)}<br>${esc(delivery)}${order.customer.note ? `<br><i>${esc(order.customer.note)}</i>` : ''}</p>
    <ul style="padding-left:18px;">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <p>Livraison : ${order.shipping ? esc(money(order.shipping, lang)) : 'Gratuite'}<br><b>Total à encaisser : ${esc(money(order.total, lang))}</b></p>
    <p><a href="${esc(siteUrl)}/admin">Ouvrir le panneau d'administration</a></p></div>`;
  return { subject: `Nouvelle commande ${order.ref} — ${money(order.total, lang)}`, html, text };
}

module.exports = {
  LOGO_CID, PRODUCT_CID, esc, money, productEmail, welcomeEmail, testEmail, orderCustomerEmail, orderOwnerEmail,
};
