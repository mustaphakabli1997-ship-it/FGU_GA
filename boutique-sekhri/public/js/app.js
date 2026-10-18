/* Boutique Sekhri storefront — vanilla JS, hash router. */
(function () {
  'use strict';

  const { art } = window.SK_ART;
  const I18N = window.SK_I18N;

  // ---------------------------------------------------------------- helpers
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    config: null,
    products: [],
    cart: store.get('sk_cart', []),
    lang: store.get('sk_lang', 'fr') === 'ar' ? 'ar' : 'fr',
  };

  const t = (key, vars) => {
    const dict = I18N[state.lang];
    let s = dict[key] ?? I18N.fr[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };

  const nf = new Intl.NumberFormat('fr-FR');
  const num = (n) => nf.format(n).replace(/\u202f/g, '\u00a0');
  const money = (n) => `<bdi dir="ltr" class="money">${num(n)}\u00a0${t('currency')}</bdi>`;
  const moneyText = (n) => `${num(n)}\u00a0${t('currency')}`;

  const api = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Erreur'), { field: data.field, status: res.status });
    return data;
  };

  const catName = (id) => {
    const c = state.config.categories.find((x) => x.id === id);
    return c ? c[state.lang] : id;
  };
  const productById = (id) => state.products.find((p) => p.id === id);
  const productBySlug = (slug) => state.products.find((p) => p.slug === slug);
  const discountOf = (p) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

  // ----------------------------------------------------------- visuals/cards
  function visual(p, hex, { eager = false } = {}) {
    if (p.images && p.images.length) {
      const second = p.images[1] ? `<img class="media-alt" src="${esc(p.images[1])}" alt="" loading="lazy" decoding="async">` : '';
      return `<img class="media-img" src="${esc(p.images[0])}" alt="${esc(p.name)}" ${eager ? '' : 'loading="lazy"'} decoding="async">${second}`;
    }
    return art(p.art, hex || (p.colors[0] && p.colors[0].hex) || '#17181a');
  }

  function badges(p) {
    const out = [];
    if (p.soldOut) out.push(`<span class="badge-tag soldout">${t('soldOut')}</span>`);
    else {
      if (p.isNew) out.push(`<span class="badge-tag new">${t('new')}</span>`);
      if (p.oldPrice) out.push(`<span class="badge-tag sale"><bdi dir="ltr">-${discountOf(p)}%</bdi></span>`);
    }
    return out.length ? `<div class="badges">${out.join('')}</div>` : '';
  }

  function card(p, i = 0) {
    const swatches = p.colors.slice(0, 5).map((c) => `<i style="background:${esc(c.hex)}" title="${esc(c.name)}"></i>`).join('');
    return `<a class="card reveal" style="--d:${(i % 4) * 70}ms" href="#/produit/${encodeURIComponent(p.slug)}">
      <div class="card-media">${badges(p)}${visual(p)}<span class="card-cta">${t('view')} <svg class="ico"><use href="#i-arrow"/></svg></span></div>
      <div class="card-info">
        <span class="card-cat">${esc(catName(p.category))}</span>
        <h3 class="card-name">${esc(p.name)}</h3>
        <div class="card-row"><span class="price">${money(p.price)}${p.oldPrice ? ` <s>${money(p.oldPrice)}</s>` : ''}</span><span class="swatches">${swatches}</span></div>
      </div>
    </a>`;
  }

  const grid = (list) => `<div class="grid">${list.map(card).join('')}</div>`;

  // -------------------------------------------------------------- newsletter
  function nlFormHTML(source) {
    return `<div class="nl-row">
        <input type="email" name="email" required autocomplete="email" inputmode="email" dir="ltr" placeholder="${esc(t('nlPlaceholder'))}" aria-label="${esc(t('nlPlaceholder'))}">
        <button class="btn btn-primary" type="submit"><span>${t('nlButton')}</span><svg class="ico"><use href="#i-arrow"/></svg></button>
      </div>
      <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="nl-note">${t('nlNote')}</p>
      <p class="nl-msg" role="status" aria-live="polite"></p>
      ${source === 'home' ? `<ul class="nl-perks"><li><svg class="ico"><use href="#i-check"/></svg>${t('nlPerk1')}</li><li><svg class="ico"><use href="#i-check"/></svg>${t('nlPerk2')}</li><li><svg class="ico"><use href="#i-check"/></svg>${t('nlPerk3')}</li></ul>` : ''}
      <input type="hidden" name="source" value="${esc(source)}">`;
  }

  function mountNewsletterForms(root = document) {
    $$('[data-nl-form]', root).forEach((form) => {
      if (form.dataset.ready === state.lang) return;
      form.dataset.ready = state.lang;
      form.innerHTML = nlFormHTML(form.dataset.source || 'site');
    });
  }

  async function onNewsletterSubmit(e) {
    const form = e.target.closest('[data-nl-form]');
    if (!form) return;
    e.preventDefault();
    const email = form.elements.email.value.trim();
    const msg = $('.nl-msg', form);
    const btn = $('button[type=submit]', form);
    msg.className = 'nl-msg';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = t('nlInvalid');
      msg.classList.add('err');
      form.elements.email.focus();
      return;
    }
    btn.disabled = true;
    try {
      await api('/api/subscribe', {
        method: 'POST',
        body: { email, lang: state.lang, source: form.elements.source.value, website: form.elements.website.value },
      });
      store.set('sk_nl', 'done');
      form.innerHTML = `<div class="nl-success"><svg class="ico"><use href="#i-check"/></svg><div><b>${t('nlThanks')}</b><span>${t('nlThanksText')}</span></div></div>`;
      if (form.closest('#nl-modal')) setTimeout(() => closeLayer($('#nl-modal')), 2600);
    } catch (err) {
      msg.textContent = err.status === 429 ? t('tooMany') : (err.message || t('nlError'));
      msg.classList.add('err');
      btn.disabled = false;
    }
  }

  function maybeShowNewsletterPopup() {
    if (store.get('sk_nl') === 'done') return;
    const dismissed = store.get('sk_nl_dismissed', 0);
    if (Date.now() - dismissed < 7 * 864e5) return;
    setTimeout(() => {
      if (!document.body.classList.contains('lock') && !location.hash.startsWith('#/commande')) openLayer($('#nl-modal'), { focus: 'input' });
    }, 3800);
  }

  // ----------------------------------------------------------------- layers
  const layers = [];
  function openLayer(el, { focus } = {}) {
    if (!el || !el.hidden) return;
    el.hidden = false;
    layers.push(el);
    if (el.id === 'cart-drawer') $('#scrim').hidden = false;
    document.body.classList.add('lock');
    requestAnimationFrame(() => {
      el.classList.add('open');
      $('#scrim').classList.toggle('open', el.id === 'cart-drawer');
      const target = (focus && $(focus, el)) || $('button, [href], input', el);
      if (target) target.focus({ preventScroll: true });
    });
  }
  function closeLayer(el) {
    if (!el || el.hidden) return;
    el.classList.remove('open');
    layers.splice(layers.indexOf(el), 1);
    if (el.id === 'cart-drawer') $('#scrim').classList.remove('open');
    if (el.id === 'nl-modal' && store.get('sk_nl') !== 'done') store.set('sk_nl_dismissed', Date.now());
    setTimeout(() => {
      el.hidden = true;
      if (el.id === 'cart-drawer') $('#scrim').hidden = true;
      if (!layers.length) document.body.classList.remove('lock');
    }, 320);
  }
  const closeAllLayers = () => [...layers].forEach(closeLayer);

  // ------------------------------------------------------------------- cart
  const lineKey = (l) => `${l.productId}|${l.size}|${l.color}`;
  const saveCart = () => store.set('sk_cart', state.cart);

  function cartLines() {
    return state.cart
      .map((l) => ({ ...l, product: productById(l.productId) }))
      .filter((l) => l.product && !l.product.soldOut);
  }
  const subtotalOf = (lines) => lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  function addToCart(product, size, color, qty = 1) {
    const line = { productId: product.id, size, color, qty };
    const existing = state.cart.find((l) => lineKey(l) === lineKey(line));
    if (existing) existing.qty = Math.min(10, existing.qty + qty);
    else state.cart.push(line);
    saveCart();
    renderCart();
    bumpCart();
  }

  function bumpCart() {
    const btn = $('#cart-btn');
    btn.classList.remove('bump');
    void btn.offsetWidth;
    btn.classList.add('bump');
  }

  function renderCart() {
    state.cart = state.cart.filter((l) => productById(l.productId));
    const lines = cartLines();
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const badge = $('#cart-count');
    badge.textContent = count;
    badge.hidden = !count;

    const body = $('#cart-body');
    const foot = $('#cart-foot');
    if (!lines.length) {
      body.innerHTML = `<div class="empty"><svg class="ico big"><use href="#i-bag"/></svg><p>${t('cartEmpty')}</p><a class="btn btn-ghost" href="#/boutique" data-close-cart>${t('continueShopping')}</a></div>`;
      foot.innerHTML = '';
      return;
    }
    const subtotal = subtotalOf(lines);
    const { freeFrom } = state.config.shipping;
    const left = Math.max(0, freeFrom - subtotal);
    const pct = Math.min(100, Math.round((subtotal / freeFrom) * 100));
    body.innerHTML = `<div class="freebar"><p>${left ? t('freeLeft', { amount: moneyText(left) }) : `<b>${t('freeReached')}</b>`}</p><div class="freebar-track"><i style="width:${pct}%"></i></div></div>
      <ul class="cart-list">${lines.map((l) => {
    const color = l.product.colors.find((c) => c.name === l.color);
    return `<li class="cart-line">
        <a class="cart-thumb" href="#/produit/${encodeURIComponent(l.product.slug)}" data-close-cart>${visual(l.product, color && color.hex)}</a>
        <div class="cart-meta">
          <a class="cart-name" href="#/produit/${encodeURIComponent(l.product.slug)}" data-close-cart>${esc(l.product.name)}</a>
          <span class="cart-opt">${esc([l.size, l.color].filter(Boolean).join(' · '))}</span>
          <div class="cart-controls">
            <div class="qty" role="group" aria-label="${t('quantity')}">
              <button type="button" data-qty="-1" data-key="${esc(lineKey(l))}" aria-label="-"><svg class="ico"><use href="#i-minus"/></svg></button>
              <output>${l.qty}</output>
              <button type="button" data-qty="1" data-key="${esc(lineKey(l))}" aria-label="+"><svg class="ico"><use href="#i-plus"/></svg></button>
            </div>
            <button class="link-btn danger" type="button" data-remove="${esc(lineKey(l))}" aria-label="${t('remove')}"><svg class="ico"><use href="#i-trash"/></svg></button>
          </div>
        </div>
        <div class="cart-price">${money(l.product.price * l.qty)}</div>
      </li>`;
  }).join('')}</ul>`;
    foot.innerHTML = `<div class="sum-row"><span>${t('subtotal')}</span><b>${money(subtotal)}</b></div>
      <p class="muted small">${t('shippingAtCheckout')}</p>
      <a class="btn btn-primary btn-block" href="#/commande" data-close-cart>${t('checkout')} <svg class="ico"><use href="#i-arrow"/></svg></a>`;
  }

  function onCartClick(e) {
    const qtyBtn = e.target.closest('[data-qty]');
    const rm = e.target.closest('[data-remove]');
    if (qtyBtn) {
      const line = state.cart.find((l) => lineKey(l) === qtyBtn.dataset.key);
      if (line) line.qty = Math.max(1, Math.min(10, line.qty + Number(qtyBtn.dataset.qty)));
    } else if (rm) {
      state.cart = state.cart.filter((l) => lineKey(l) !== rm.dataset.remove);
    } else {
      if (e.target.closest('[data-close-cart]')) closeLayer($('#cart-drawer'));
      return;
    }
    saveCart();
    renderCart();
    if (location.hash.startsWith('#/commande')) renderRoute({ keepScroll: true });
  }

  // ------------------------------------------------------------------ views
  const ICONS = { award: 'i-award', truck: 'i-truck', cash: 'i-cash', bolt: 'i-bolt' };

  function viewHome() {
    const sorted = state.products;
    const latest = sorted.slice(0, 8);
    const featured = sorted.filter((p) => p.featured).slice(0, 4);
    const signature = sorted.find((p) => p.featured && p.category === 'ensembles') || sorted.find((p) => p.category === 'ensembles') || sorted[0];
    const counts = Object.fromEntries(state.config.categories.map((c) => [c.id, sorted.filter((p) => p.category === c.id).length]));
    const cats = state.config.categories.filter((c) => counts[c.id]);

    const ticker = ['ensembles', 'tricots', 'pantalons', 'shorts', 'sweats', 'vestes', 'tshirts']
      .map((id) => `<span>${esc(catName(id))}</span><i>✦</i>`).join('');

    return `
    <section class="hero" id="hero">
      <div class="hero-bg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i><i class="streaks"></i></div>
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="eyebrow reveal">${t('heroEyebrow')}</p>
          <h1 class="hero-title"><span class="line outline reveal" style="--d:80ms">LUXURY</span><span class="line solid reveal" style="--d:160ms">SPORTSWEAR</span></h1>
          <p class="hero-sub reveal" style="--d:260ms">${t('heroSub')}</p>
          <div class="hero-cta reveal" style="--d:340ms">
            <a class="btn btn-primary" href="#/boutique">${t('heroCta')} <svg class="ico"><use href="#i-arrow"/></svg></a>
            <a class="btn btn-ghost" href="#/nouveautes">${t('heroCta2')}</a>
          </div>
          <dl class="hero-stats reveal" style="--d:420ms">
            <div><dt data-count="58">58</dt><dd>${t('statWilayas')}</dd></div>
            <div><dt><bdi dir="ltr">19–50</bdi></dt><dd>${t('statAges')}</dd></div>
            <div><dt><svg class="ico"><use href="#i-cash"/></svg></dt><dd>${t('statCod')}</dd></div>
          </dl>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="mark-stage"><svg class="hero-mark" viewBox="15 8 808 508"><use href="#sk-mark"/></svg></div>
          <div class="float f1">${art('hoodie', '#17181a')}</div>
          <div class="float f2">${art('jogger', '#383a40')}</div>
          <div class="float f3">${art('tshirt', '#e9e6df')}</div>
        </div>
      </div>
      <a class="scroll-cue" href="#cats" data-scroll aria-label="${t('scroll')}"><i></i></a>
    </section>

    <div class="ticker-wrap" aria-hidden="true"><div class="ticker"><div class="ticker-track">${ticker.repeat(4)}</div></div></div>

    <section class="section" id="cats">
      <div class="container">
        <header class="section-head reveal"><p class="eyebrow">${t('catsEyebrow')}</p><h2 class="display">${t('catsTitle')}</h2></header>
        <div class="cat-grid">${cats.map((c, i) => {
    const sample = sorted.find((p) => p.category === c.id);
    return `<a class="cat-tile reveal" style="--d:${(i % 4) * 70}ms" href="#/boutique/${c.id}">
            <span class="cat-num">${String(i + 1).padStart(2, '0')}</span>
            <div class="cat-art">${art(c.art, (sample && sample.colors[0] && sample.colors[0].hex) || '#17181a')}</div>
            <div class="cat-label"><b>${esc(c[state.lang])}</b><span>${t('pieces', { n: counts[c.id] })}</span></div>
            <i class="cat-arrow"><svg class="ico"><use href="#i-arrow"/></svg></i>
          </a>`;
  }).join('')}</div>
      </div>
    </section>

    <section class="section tight" id="latest">
      <div class="container">
        <header class="section-head row reveal"><div><p class="eyebrow">${t('latestEyebrow')}</p><h2 class="display">${t('latestTitle')}</h2></div><a class="link-arrow" href="#/nouveautes">${t('seeAll')} <svg class="ico"><use href="#i-arrow"/></svg></a></header>
        ${grid(latest)}
      </div>
    </section>

    ${signature ? `<section class="signature">
      <div class="container signature-inner">
        <div class="signature-art reveal"><div class="plate">${visual(signature, signature.colors[0] && signature.colors[0].hex)}</div><span class="ring"></span></div>
        <div class="signature-copy reveal" style="--d:120ms">
          <p class="eyebrow">${t('sigEyebrow')}</p>
          <h2 class="display">${esc(signature.name)}</h2>
          <p class="lead">${esc(signature.description || t('sigText'))}</p>
          <div class="signature-price">${money(signature.price)}${signature.oldPrice ? ` <s>${money(signature.oldPrice)}</s>` : ''}</div>
          <a class="btn btn-primary" href="#/produit/${encodeURIComponent(signature.slug)}">${t('sigCta')} <svg class="ico"><use href="#i-arrow"/></svg></a>
        </div>
      </div>
    </section>` : ''}

    ${featured.length ? `<section class="section tight">
      <div class="container">
        <header class="section-head row reveal"><div><p class="eyebrow">${t('featEyebrow')}</p><h2 class="display">${t('featTitle')}</h2></div><a class="link-arrow" href="#/boutique">${t('seeAll')} <svg class="ico"><use href="#i-arrow"/></svg></a></header>
        ${grid(featured)}
      </div>
    </section>` : ''}

    <section class="perks">
      <div class="container perks-grid">${['award', 'truck', 'cash', 'bolt'].map((k, i) => `<div class="perk reveal" style="--d:${i * 80}ms"><svg class="ico"><use href="#${ICONS[k]}"/></svg><b>${t(`perk_${k}`)}</b><span>${t(`perk_${k}_t`)}</span></div>`).join('')}</div>
    </section>

    <section class="statement">
      <div class="container">
        <h2 class="statement-text reveal"><span class="outline">${t('stmt1')}</span> <span>${t('stmt2')}</span> <em>${t('stmt3')}</em></h2>
        <p class="statement-sub reveal" style="--d:100ms">${t('stmtSub')}</p>
      </div>
    </section>

    <section class="nl-section" id="club">
      <div class="container nl-inner">
        <div class="nl-copy reveal">
          <svg class="nl-mark" viewBox="15 8 808 508" aria-hidden="true"><use href="#sk-mark"/></svg>
          <p class="eyebrow">${t('nlEyebrow')}</p>
          <h2 class="display">${t('nlTitle')}</h2>
          <p class="lead">${t('nlText')}</p>
        </div>
        <form class="nl-form big reveal" style="--d:120ms" data-nl-form data-source="home" novalidate></form>
      </div>
    </section>`;
  }

  function shopParams(query) {
    const q = new URLSearchParams(query);
    return { q: (q.get('q') || '').trim(), sort: q.get('sort') || 'new', size: q.get('size') || '' };
  }

  function viewShop(cat, query, { onlyNew = false } = {}) {
    const { q, sort, size } = shopParams(query);
    let list = [...state.products];
    if (onlyNew) list = list.slice(0, 24);
    if (cat) list = list.filter((p) => p.category === cat);
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((p) => `${p.name} ${catName(p.category)} ${p.description}`.toLowerCase().includes(needle));
    }
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);

    const base = onlyNew ? '#/nouveautes' : `#/boutique${cat ? `/${cat}` : ''}`;
    const href = (patch) => {
      const params = new URLSearchParams();
      const next = { q, sort, size, ...patch };
      if (next.q) params.set('q', next.q);
      if (next.sort && next.sort !== 'new') params.set('sort', next.sort);
      if (next.size) params.set('size', next.size);
      const s = params.toString();
      return s ? `${base}?${s}` : base;
    };
    const catLink = (id, label) => `<a class="chip ${cat === id ? 'on' : ''}" href="#/boutique${id ? `/${id}` : ''}${query ? `?${query}` : ''}">${label}</a>`;
    const allSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const title = onlyNew ? t('latestTitle') : cat ? catName(cat) : t('shopTitle');

    return `<section class="page-head">
        <div class="container">
          <nav class="crumbs" aria-label="breadcrumb"><a href="#/">${t('home')}</a><i>/</i><span>${esc(title)}</span></nav>
          <h1 class="display reveal">${esc(title)}</h1>
          <p class="muted">${t('pieces', { n: list.length })}</p>
        </div>
      </section>
      <section class="section tight no-top">
        <div class="container">
          <div class="filters">
            <div class="chips scroll-x">${catLink('', t('all'))}${state.config.categories.map((c) => catLink(c.id, esc(c[state.lang]))).join('')}</div>
            <div class="filter-row">
              <form class="shop-search" role="search" data-shop-search data-base="${esc(base)}">
                <svg class="ico"><use href="#i-search"/></svg>
                <input name="q" type="search" value="${esc(q)}" placeholder="${esc(t('searchPh'))}" aria-label="${esc(t('searchPh'))}">
              </form>
              <div class="size-filter" role="group" aria-label="${t('size')}">${allSizes.map((s) => `<a class="chip sm ${size === s ? 'on' : ''}" href="${href({ size: size === s ? '' : s })}">${s}</a>`).join('')}</div>
              <label class="select"><span class="sr">${t('sortBy')}</span>
                <select data-sort data-base="${esc(base)}">
                  ${[['new', 'sortNew'], ['price-asc', 'sortPriceAsc'], ['price-desc', 'sortPriceDesc']].map(([v, k]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}
                </select>
              </label>
            </div>
          </div>
          ${list.length ? grid(list) : `<div class="empty wide"><svg class="ico big"><use href="#i-search"/></svg><p>${t('noResults')}</p><a class="btn btn-ghost" href="${base}">${t('resetFilters')}</a></div>`}
        </div>
      </section>`;
  }

  function viewProduct(slug) {
    const p = productBySlug(slug);
    if (!p) return viewNotFound();
    const hasImages = p.images && p.images.length;
    const onlySize = p.sizes.length === 1 ? p.sizes[0] : '';
    const firstColor = p.colors[0];
    const related = state.products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    const wa = state.config.contact.whatsapp;
    const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`${p.name} — ${location.origin}/#/produit/${p.slug}`)}` : '';

    const gallery = hasImages
      ? `<div class="gallery"><div class="stage main-stage"><img id="main-img" src="${esc(p.images[0])}" alt="${esc(p.name)}" decoding="async"></div>
          ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((src, i) => `<button type="button" class="thumb ${i ? '' : 'on'}" data-thumb="${esc(src)}" aria-label="${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div>`
      : `<div class="gallery"><div class="stage main-stage art-stage" id="art-stage">${badges(p)}${art(p.art, firstColor ? firstColor.hex : '#17181a')}</div></div>`;

    return `<section class="product-page" data-pid="${esc(p.id)}">
      <div class="container">
        <nav class="crumbs" aria-label="breadcrumb"><a href="#/">${t('home')}</a><i>/</i><a href="#/boutique/${p.category}">${esc(catName(p.category))}</a><i>/</i><span>${esc(p.name)}</span></nav>
        <div class="product-grid">
          ${gallery}
          <div class="product-info">
            <p class="eyebrow">${esc(catName(p.category))}</p>
            <h1 class="product-title">${esc(p.name)}</h1>
            <div class="product-price">${money(p.price)}${p.oldPrice ? ` <s>${money(p.oldPrice)}</s><span class="badge-tag sale"><bdi dir="ltr">-${discountOf(p)}%</bdi></span>` : ''}</div>
            ${p.description ? `<p class="lead">${esc(p.description)}</p>` : ''}

            ${p.colors.length ? `<fieldset class="opt"><legend>${t('color')}: <b id="color-label">${esc(firstColor.name)}</b></legend>
              <div class="swatch-list">${p.colors.map((c, i) => `<label class="swatch"><input type="radio" name="color" value="${esc(c.name)}" data-hex="${esc(c.hex)}" ${i === 0 ? 'checked' : ''}><i style="background:${esc(c.hex)}"></i><span class="sr">${esc(c.name)}</span></label>`).join('')}</div></fieldset>` : ''}

            ${p.sizes.length ? `<fieldset class="opt" id="size-opt"><legend>${t('size')}</legend>
              <div class="size-list">${p.sizes.map((s) => `<label class="size"><input type="radio" name="size" value="${esc(s)}" ${s === onlySize ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}</div>
              <p class="field-error" id="size-error" hidden>${t('pickSize')}</p></fieldset>` : ''}

            <div class="buy-row">
              <div class="qty big" role="group" aria-label="${t('quantity')}">
                <button type="button" id="q-minus" aria-label="-"><svg class="ico"><use href="#i-minus"/></svg></button>
                <output id="q-val">1</output>
                <button type="button" id="q-plus" aria-label="+"><svg class="ico"><use href="#i-plus"/></svg></button>
              </div>
              ${p.soldOut
    ? `<button class="btn btn-primary grow" type="button" disabled>${t('soldOut')}</button>`
    : `<button class="btn btn-primary grow" type="button" id="add-btn"><svg class="ico"><use href="#i-bag"/></svg>${t('addToCart')}</button>`}
            </div>
            ${p.soldOut ? '' : `<button class="btn btn-ghost btn-block" type="button" id="buy-now">${t('buyNow')} <svg class="ico"><use href="#i-arrow"/></svg></button>`}
            ${waLink ? `<a class="btn btn-whatsapp btn-block" href="${esc(waLink)}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-whatsapp"/></svg>${t('orderWhatsapp')}</a>` : ''}

            <ul class="assurances">
              <li><svg class="ico"><use href="#i-truck"/></svg>${t('assureDelivery')}</li>
              <li><svg class="ico"><use href="#i-cash"/></svg>${t('assureCod')}</li>
              <li><svg class="ico"><use href="#i-award"/></svg>${t('assureQuality')}</li>
            </ul>
            <button class="notify-link" type="button" data-open-nl><svg class="ico"><use href="#i-bell"/></svg>${t('notifyMe')}</button>
          </div>
        </div>
        ${related.length ? `<div class="related"><header class="section-head reveal"><h2 class="display sm">${t('related')}</h2></header>${grid(related)}</div>` : ''}
      </div>
      ${p.soldOut ? '' : `<div class="sticky-buy" id="sticky-buy"><div><b>${esc(p.name)}</b>${money(p.price)}</div><button class="btn btn-primary" type="button" id="sticky-add">${t('addToCart')}</button></div>`}
    </section>`;
  }

  function bindProduct(slug) {
    const p = productBySlug(slug);
    const root = $('.product-page');
    if (!p || !root) return;
    let qty = 1;
    const selected = () => ({
      size: ($('input[name=size]:checked', root) || {}).value || '',
      color: ($('input[name=color]:checked', root) || {}).value || '',
    });

    $$('input[name=color]', root).forEach((input) => input.addEventListener('change', () => {
      $('#color-label', root).textContent = input.value;
      const stage = $('#art-stage', root);
      if (stage) stage.innerHTML = `${badges(p)}${art(p.art, input.dataset.hex)}`;
    }));
    $$('[data-thumb]', root).forEach((btn) => btn.addEventListener('click', () => {
      $('#main-img', root).src = btn.dataset.thumb;
      $$('.thumb', root).forEach((b) => b.classList.toggle('on', b === btn));
    }));
    $$('input[name=size]', root).forEach((i) => i.addEventListener('change', () => { $('#size-error', root).hidden = true; }));
    $('#q-minus', root).addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#q-val', root).textContent = qty; });
    $('#q-plus', root).addEventListener('click', () => { qty = Math.min(10, qty + 1); $('#q-val', root).textContent = qty; });

    const submit = (goCheckout) => {
      const { size, color } = selected();
      if (p.sizes.length && !size) {
        const err = $('#size-error', root);
        err.hidden = false;
        $('#size-opt', root).classList.remove('shake');
        void $('#size-opt', root).offsetWidth;
        $('#size-opt', root).classList.add('shake');
        $('#size-opt', root).scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      addToCart(p, size, color, qty);
      if (goCheckout) location.hash = '#/commande';
      else { toast(t('addedToCart')); openLayer($('#cart-drawer')); }
    };
    const add = $('#add-btn', root);
    if (add) add.addEventListener('click', () => submit(false));
    const now = $('#buy-now', root);
    if (now) now.addEventListener('click', () => submit(true));
    const sticky = $('#sticky-add', root);
    if (sticky) sticky.addEventListener('click', () => submit(false));
  }

  function viewCheckout() {
    const lines = cartLines();
    if (!lines.length) {
      return `<section class="page-head"><div class="container"><h1 class="display">${t('checkout')}</h1></div></section>
        <section class="section no-top"><div class="container"><div class="empty wide"><svg class="ico big"><use href="#i-bag"/></svg><p>${t('cartEmpty')}</p><a class="btn btn-primary" href="#/boutique">${t('continueShopping')}</a></div></div></section>`;
    }
    const subtotal = subtotalOf(lines);
    const { home, desk, freeFrom } = state.config.shipping;
    const free = subtotal >= freeFrom;
    const draft = store.get('sk_draft', {});
    const field = (name, label, attrs = '', value = draft[name] || '') =>
      `<label class="field" data-field="${name}"><span>${label}</span><input name="${name}" value="${esc(value)}" ${attrs}><em class="field-error" hidden></em></label>`;

    return `<section class="page-head"><div class="container"><nav class="crumbs"><a href="#/">${t('home')}</a><i>/</i><span>${t('checkout')}</span></nav><h1 class="display">${t('checkoutTitle')}</h1><p class="muted">${t('checkoutSub')}</p></div></section>
    <section class="section no-top"><div class="container checkout-grid">
      <form class="checkout-form" id="checkout-form" novalidate>
        <h2 class="block-title"><i>1</i>${t('yourInfo')}</h2>
        <div class="field-grid">
          ${field('name', t('fullName'), 'required autocomplete="name"')}
          ${field('phone', t('phone'), 'required inputmode="tel" autocomplete="tel" dir="ltr" placeholder="05 / 06 / 07 …"')}
        </div>
        <div class="field-grid">
          <label class="field" data-field="wilaya"><span>${t('wilaya')}</span>
            <select name="wilaya" required autocomplete="address-level1"><option value="">${t('chooseWilaya')}</option>
              ${state.config.wilayas.map((w) => `<option value="${w.code}" ${draft.wilaya === w.code ? 'selected' : ''}>${w.code} — ${esc(w[state.lang])}</option>`).join('')}
            </select><em class="field-error" hidden></em></label>
          ${field('address', t('address'), 'required autocomplete="street-address"')}
        </div>
        ${field('email', `${t('emailOpt')}`, 'type="email" inputmode="email" dir="ltr" autocomplete="email"')}
        <label class="check"><input type="checkbox" name="newsletter" ${draft.newsletter ? 'checked' : ''}><i></i><span>${t('checkoutNl')}</span></label>

        <h2 class="block-title"><i>2</i>${t('deliveryMode')}</h2>
        <div class="radio-cards">
          <label class="radio-card"><input type="radio" name="delivery" value="home" ${draft.delivery !== 'desk' ? 'checked' : ''}><span><b>${t('home_delivery')}</b><small>${free ? t('free') : moneyText(home)}</small></span></label>
          <label class="radio-card"><input type="radio" name="delivery" value="desk" ${draft.delivery === 'desk' ? 'checked' : ''}><span><b>${t('desk_delivery')}</b><small>${free ? t('free') : moneyText(desk)}</small></span></label>
        </div>
        ${field('note', t('note'), 'maxlength="300"')}

        <h2 class="block-title"><i>3</i>${t('payment')}</h2>
        <div class="pay-card"><svg class="ico"><use href="#i-cash"/></svg><div><b>${t('cod')}</b><span>${t('codText')}</span></div></div>
        <p class="form-error" id="form-error" role="alert" hidden></p>
        <button class="btn btn-primary btn-block lg" type="submit" id="place-order"><span>${t('placeOrder')}</span> <svg class="ico"><use href="#i-arrow"/></svg></button>
      </form>

      <aside class="summary">
        <h2 class="block-title">${t('summary')}</h2>
        <ul class="sum-list">${lines.map((l) => {
    const color = l.product.colors.find((c) => c.name === l.color);
    return `<li><div class="sum-thumb">${visual(l.product, color && color.hex)}<em>${l.qty}</em></div>
            <div class="sum-meta"><b>${esc(l.product.name)}</b><span>${esc([l.size, l.color].filter(Boolean).join(' · '))}</span></div><div>${money(l.product.price * l.qty)}</div></li>`;
  }).join('')}</ul>
        <div class="sum-row"><span>${t('subtotal')}</span><span>${money(subtotal)}</span></div>
        <div class="sum-row"><span>${t('shipping')}</span><span id="ship-val">${free ? t('free') : money(draft.delivery === 'desk' ? desk : home)}</span></div>
        <div class="sum-row total"><span>${t('totalToPay')}</span><b id="total-val">${money(subtotal + (free ? 0 : draft.delivery === 'desk' ? desk : home))}</b></div>
        <p class="muted small">${free ? `<b class="ok">${t('freeReached')}</b>` : t('freeLeft', { amount: moneyText(freeFrom - subtotal) })}</p>
      </aside>
    </div></section>`;
  }

  function bindCheckout() {
    const form = $('#checkout-form');
    if (!form) return;
    const lines = cartLines();
    const subtotal = subtotalOf(lines);
    const { home, desk, freeFrom } = state.config.shipping;

    const draftKeys = ['name', 'phone', 'wilaya', 'address', 'email', 'note'];
    const saveDraft = () => {
      const d = Object.fromEntries(draftKeys.map((k) => [k, form.elements[k].value]));
      d.delivery = form.elements.delivery.value;
      d.newsletter = form.elements.newsletter.checked;
      store.set('sk_draft', d);
    };
    const recalc = () => {
      const fee = subtotal >= freeFrom ? 0 : form.elements.delivery.value === 'desk' ? desk : home;
      $('#ship-val').innerHTML = fee ? money(fee) : t('free');
      $('#total-val').innerHTML = money(subtotal + fee);
    };
    form.addEventListener('input', () => { saveDraft(); });
    form.addEventListener('change', () => { saveDraft(); recalc(); });

    const setError = (name, message) => {
      const wrap = $(`[data-field="${name}"]`, form);
      if (!wrap) return;
      const em = $('.field-error', wrap);
      wrap.classList.toggle('invalid', Boolean(message));
      em.hidden = !message;
      em.textContent = message || '';
    };
    const normPhone = (v) => v.replace(/[\s.\-()]/g, '').replace(/^(\+213|00213)/, '0');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const el = form.elements;
      const errors = {};
      if (el.name.value.trim().length < 2) errors.name = t('errName');
      if (!/^0[567]\d{8}$/.test(normPhone(el.phone.value))) errors.phone = t('errPhone');
      if (!el.wilaya.value) errors.wilaya = t('errWilaya');
      if (el.address.value.trim().length < 4) errors.address = t('errAddress');
      if (el.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim())) errors.email = t('nlInvalid');
      ['name', 'phone', 'wilaya', 'address', 'email'].forEach((k) => setError(k, errors[k]));
      const first = Object.keys(errors)[0];
      if (first) { el[first].focus(); return; }

      const btn = $('#place-order');
      const formError = $('#form-error');
      formError.hidden = true;
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        const res = await api('/api/orders', {
          method: 'POST',
          body: {
            lang: state.lang,
            customer: {
              name: el.name.value, phone: el.phone.value, wilaya: el.wilaya.value, address: el.address.value,
              email: el.email.value, note: el.note.value, delivery: el.delivery.value, newsletter: el.newsletter.checked,
            },
            items: lines.map((l) => ({ productId: l.productId, size: l.size, color: l.color, qty: l.qty })),
          },
        });
        sessionStorage.setItem('sk_last_order', JSON.stringify({ ...res, name: el.name.value.trim().split(' ')[0], emailed: Boolean(el.email.value.trim()) }));
        state.cart = [];
        saveCart();
        store.set('sk_draft', {});
        if (el.newsletter.checked && el.email.value.trim()) store.set('sk_nl', 'done');
        renderCart();
        location.hash = `#/merci/${encodeURIComponent(res.ref)}`;
      } catch (err) {
        if (err.field && $(`[data-field="${err.field}"]`, form)) setError(err.field, err.message);
        else { formError.textContent = err.status === 429 ? t('tooMany') : err.message; formError.hidden = false; }
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });
  }

  function viewThanks(ref) {
    let last = null;
    try { last = JSON.parse(sessionStorage.getItem('sk_last_order') || 'null'); } catch { /* ignore */ }
    if (last && last.ref !== ref) last = null;
    return `<section class="thanks"><div class="container narrow">
      <div class="thanks-mark"><svg class="ico"><use href="#i-check"/></svg></div>
      <p class="eyebrow">${t('orderReceived')}</p>
      <h1 class="display">${last ? t('thanksName', { name: esc(last.name) }) : t('thanks')}</h1>
      <p class="lead">${t('thanksText')}</p>
      <div class="ref-card"><span>${t('orderRef')}</span><b>${esc(ref)}</b>${last ? `<span>${t('totalToPay')}</span><b class="orange">${money(last.total)}</b>` : ''}</div>
      <a class="btn btn-primary" href="#/boutique">${t('continueShopping')} <svg class="ico"><use href="#i-arrow"/></svg></a>
    </div></section>`;
  }

  function viewNotFound() {
    return `<section class="thanks"><div class="container narrow"><p class="eyebrow">404</p><h1 class="display">${t('notFound')}</h1><p class="lead">${t('notFoundText')}</p><a class="btn btn-primary" href="#/boutique">${t('continueShopping')}</a></div></section>`;
  }

  // ----------------------------------------------------------------- chrome
  function renderChrome() {
    const cats = state.config.categories;
    const links = [`<a href="#/nouveautes" data-route="nouveautes">${t('navNew')}</a>`]
      .concat(cats.map((c) => `<a href="#/boutique/${c.id}" data-route="boutique/${c.id}">${esc(c.short[state.lang])}</a>`));
    $('#nav').innerHTML = links.join('');
    $('#mobile-nav').innerHTML = `<a href="#/boutique">${t('shopTitle')}</a>${links.join('')}<button type="button" class="mm-nl" data-open-nl><svg class="ico"><use href="#i-bell"/></svg>${t('nlTitle')}</button>`;
    $('#lang-btn').textContent = state.lang === 'ar' ? 'FR' : 'AR';

    const { freeFrom } = state.config.shipping;
    const items = [t('annDelivery'), t('annCod'), t('annFree', { amount: moneyText(freeFrom) }), t('annClub')];
    $('#announce-track').innerHTML = [...items, ...items, ...items, ...items].map((s) => `<span>${esc(s)}</span><i>✦</i>`).join('');

    const c = state.config.contact;
    const social = [
      c.instagram && `<a href="https://instagram.com/${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram"><svg class="ico"><use href="#i-instagram"/></svg></a>`,
      c.facebook && /^https?:\/\//.test(c.facebook) && `<a href="${esc(c.facebook)}" target="_blank" rel="noopener" aria-label="Facebook"><svg class="ico"><use href="#i-facebook"/></svg></a>`,
      c.tiktok && `<a href="https://tiktok.com/@${esc(c.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok"><svg class="ico"><use href="#i-tiktok"/></svg></a>`,
      c.whatsapp && `<a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg class="ico"><use href="#i-whatsapp"/></svg></a>`,
    ].filter(Boolean).join('');
    const contactLines = [
      c.phone && `<li><svg class="ico"><use href="#i-phone"/></svg><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}" dir="ltr">${esc(c.phone)}</a></li>`,
      c.email && `<li><svg class="ico"><use href="#i-mail"/></svg><a href="mailto:${esc(c.email)}" dir="ltr">${esc(c.email)}</a></li>`,
      c.address && `<li><svg class="ico"><use href="#i-pin"/></svg><span>${esc(c.address)}</span></li>`,
    ].filter(Boolean).join('');

    $('#footer').innerHTML = `
      <div class="footer-nl"><div class="container footer-nl-inner">
        <div><p class="eyebrow">${t('nlEyebrow')}</p><h2 class="display sm">${t('nlTitle')}</h2></div>
        <form class="nl-form" data-nl-form data-source="footer" novalidate></form>
      </div></div>
      <div class="container footer-grid">
        <div class="footer-brand">
          <svg class="footer-mark" viewBox="15 8 808 508" aria-hidden="true"><use href="#sk-mark"/></svg>
          <p class="footer-name"><b>Boutique</b> <em>Sekhri</em></p>
          <p class="footer-tag">LUXURY SPORTSWEAR</p>
          <p class="muted">${t('footerBlurb')}</p>
          ${social ? `<div class="social">${social}</div>` : ''}
        </div>
        <div><h3>${t('footerShop')}</h3><ul>${cats.map((x) => `<li><a href="#/boutique/${x.id}">${esc(x[state.lang])}</a></li>`).join('')}</ul></div>
        <div><h3>${t('footerHelp')}</h3><ul class="plain"><li>${t('assureDelivery')}</li><li>${t('assureCod')}</li>${contactLines}</ul></div>
      </div>
      <div class="footer-bottom"><div class="container"><span>© ${new Date().getFullYear()} Boutique Sekhri</span><span>${t('footerMade')}</span></div></div>`;

    let wa = $('#wa-float');
    if (c.whatsapp) {
      if (!wa) {
        wa = document.createElement('a');
        wa.id = 'wa-float';
        wa.className = 'wa-float';
        wa.target = '_blank';
        wa.rel = 'noopener';
        wa.innerHTML = '<svg class="ico"><use href="#i-whatsapp"/></svg>';
        document.body.append(wa);
      }
      wa.href = `https://wa.me/${c.whatsapp}`;
      wa.setAttribute('aria-label', 'WhatsApp');
    }
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-i18n-ph]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
    $('#nl-modal').querySelectorAll('[data-nl-form]').forEach((f) => { f.dataset.ready = ''; });
    mountNewsletterForms();
  }

  function setActiveNav(path) {
    $$('#nav a').forEach((a) => a.classList.toggle('on', path === a.dataset.route));
  }

  // ----------------------------------------------------------------- router
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { path: path.replace(/\/$/, ''), parts: path.split('/').filter(Boolean).map(decodeURIComponent), query };
  }

  let lastPath = '';
  let refetchedFor = '';
  function renderRoute({ keepScroll = false } = {}) {
    const { path, parts, query } = parseHash();
    const main = $('#main');
    let html;
    let title = '';
    const [view, arg] = parts;

    // A product added after this page loaded (e.g. from an emailed link): refresh the catalogue once.
    if (view === 'produit' && !productBySlug(arg) && refetchedFor !== arg) {
      refetchedFor = arg;
      api('/api/products').then((list) => { state.products = list; renderCart(); renderRoute(); }).catch(() => {});
      return;
    }

    document.body.dataset.route = view || 'home';
    if (!view) { html = viewHome(); title = ''; }
    else if (view === 'boutique') { html = viewShop(arg, query); title = arg ? catName(arg) : t('shopTitle'); }
    else if (view === 'nouveautes') { html = viewShop('', query, { onlyNew: true }); title = t('latestTitle'); }
    else if (view === 'produit') { const p = productBySlug(arg); html = viewProduct(arg); title = p ? p.name : t('notFound'); }
    else if (view === 'commande') { html = viewCheckout(); title = t('checkout'); }
    else if (view === 'merci') { html = viewThanks(arg || ''); title = t('thanks'); }
    else { html = viewNotFound(); title = t('notFound'); }

    main.innerHTML = html;
    document.title = title ? `${title} — Boutique Sekhri` : 'Boutique Sekhri — Luxury Sportswear';
    setActiveNav(path);
    mountNewsletterForms(main);

    if (view === 'produit') bindProduct(arg);
    if (view === 'commande') bindCheckout();
    initReveal(main);
    initHero();

    const samePage = path.split('/')[0] === lastPath.split('/')[0] && view === 'boutique';
    if (!keepScroll && !(samePage && lastPath !== path)) window.scrollTo({ top: 0, behavior: 'auto' });
    lastPath = path;
    closeAllLayers();
    document.body.classList.toggle('on-home', !view);
  }

  // ---------------------------------------------------------------- effects
  let revealObserver;
  function initReveal(root) {
    const els = $$('.reveal', root);
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach((el) => el.classList.add('in')); return; }
    revealObserver && revealObserver.disconnect();
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => revealObserver.observe(el));
  }

  let heroCleanup = null;
  function initHero() {
    heroCleanup && heroCleanup();
    heroCleanup = null;
    const hero = $('#hero');
    if (!hero || reduceMotion || matchMedia('(hover: none)').matches) return;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    };
    hero.addEventListener('pointermove', onMove);
    heroCleanup = () => hero.removeEventListener('pointermove', onMove);
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<svg class="ico"><use href="#i-check"/></svg><span>${esc(message)}</span>`;
    $('#toasts').append(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, 2600);
  }

  // ----------------------------------------------------------------- search
  function runSearch(value) {
    const q = value.trim().toLowerCase();
    const box = $('#search-results');
    if (!q) { box.innerHTML = `<p class="muted">${t('searchHint')}</p>`; return; }
    const found = state.products.filter((p) => `${p.name} ${catName(p.category)} ${p.description}`.toLowerCase().includes(q)).slice(0, 8);
    box.innerHTML = found.length
      ? `<ul>${found.map((p) => `<li><a href="#/produit/${encodeURIComponent(p.slug)}" data-close-search><span class="sr-thumb">${visual(p)}</span><span class="sr-meta"><b>${esc(p.name)}</b><small>${esc(catName(p.category))}</small></span>${money(p.price)}</a></li>`).join('')}</ul>
         <a class="link-arrow" href="#/boutique?q=${encodeURIComponent(value.trim())}" data-close-search>${t('seeAll')} <svg class="ico"><use href="#i-arrow"/></svg></a>`
      : `<p class="muted">${t('noResults')}</p>`;
  }

  // -------------------------------------------------------------------- lang
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('is-ar', state.lang === 'ar');
  }

  function setLang(lang) {
    state.lang = lang;
    store.set('sk_lang', lang);
    applyLang();
    renderChrome();
    renderCart();
    renderRoute({ keepScroll: true });
  }

  // ------------------------------------------------------------------- boot
  function bindGlobal() {
    document.addEventListener('submit', onNewsletterSubmit);
    $('#cart-btn').addEventListener('click', () => openLayer($('#cart-drawer')));
    $('#cart-close').addEventListener('click', () => closeLayer($('#cart-drawer')));
    $('#scrim').addEventListener('click', () => closeLayer($('#cart-drawer')));
    $('#cart-drawer').addEventListener('click', onCartClick);
    $('#lang-btn').addEventListener('click', () => setLang(state.lang === 'ar' ? 'fr' : 'ar'));
    $('#nl-btn').addEventListener('click', () => openLayer($('#nl-modal'), { focus: 'input' }));
    $('#nl-close').addEventListener('click', () => closeLayer($('#nl-modal')));
    $('#nl-later').addEventListener('click', () => closeLayer($('#nl-modal')));
    $('#nl-modal').addEventListener('click', (e) => { if (e.target.id === 'nl-modal') closeLayer($('#nl-modal')); });
    $('#menu-btn').addEventListener('click', () => { openLayer($('#mobile-menu')); $('#menu-btn').setAttribute('aria-expanded', 'true'); });
    $('#menu-close').addEventListener('click', () => { closeLayer($('#mobile-menu')); $('#menu-btn').setAttribute('aria-expanded', 'false'); });
    $('#mobile-menu').addEventListener('click', (e) => {
      if (e.target.closest('a')) closeLayer($('#mobile-menu'));
      if (e.target.closest('[data-open-nl]')) { closeLayer($('#mobile-menu')); setTimeout(() => openLayer($('#nl-modal'), { focus: 'input' }), 340); }
    });
    $('#search-btn').addEventListener('click', () => { openLayer($('#search-overlay'), { focus: 'input' }); runSearch($('#search-input').value); });
    $('#search-close').addEventListener('click', () => closeLayer($('#search-overlay')));
    $('#search-input').addEventListener('input', (e) => runSearch(e.target.value));
    $('#search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        location.hash = `#/boutique?q=${encodeURIComponent(e.target.value.trim())}`;
        closeLayer($('#search-overlay'));
      }
    });
    $('#search-overlay').addEventListener('click', (e) => {
      if (e.target.closest('[data-close-search]') || e.target.id === 'search-overlay') closeLayer($('#search-overlay'));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && layers.length) closeLayer(layers[layers.length - 1]);
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-nl]')) openLayer($('#nl-modal'), { focus: 'input' });
      const jump = e.target.closest('[data-scroll]');
      if (jump) { e.preventDefault(); const t0 = $(jump.getAttribute('href')); t0 && t0.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
      if (e.target.closest('.announce-track')) openLayer($('#nl-modal'), { focus: 'input' });
    });

    document.addEventListener('change', (e) => {
      const sort = e.target.closest('[data-sort]');
      if (sort) {
        const { query } = parseHash();
        const params = new URLSearchParams(query);
        if (sort.value === 'new') params.delete('sort'); else params.set('sort', sort.value);
        const s = params.toString();
        location.hash = s ? `${sort.dataset.base}?${s}` : sort.dataset.base;
      }
    });
    document.addEventListener('submit', (e) => {
      const f = e.target.closest('[data-shop-search]');
      if (!f) return;
      e.preventDefault();
      const { query } = parseHash();
      const params = new URLSearchParams(query);
      const q = f.elements.q.value.trim();
      if (q) params.set('q', q); else params.delete('q');
      const s = params.toString();
      location.hash = s ? `${f.dataset.base}?${s}` : f.dataset.base;
    });

    const header = $('#header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    window.addEventListener('hashchange', () => renderRoute());
  }

  async function boot() {
    applyLang();
    try {
      const [config, products] = await Promise.all([api('/api/config'), api('/api/products')]);
      state.config = config;
      state.products = products;
    } catch {
      $('#main').innerHTML = '<section class="thanks"><div class="container narrow"><h1 class="display">Boutique Sekhri</h1><p class="lead">Service momentanément indisponible. Réessayez dans un instant.</p></div></section>';
      document.getElementById('preloader').remove();
      return;
    }
    renderChrome();
    renderCart();
    bindGlobal();
    renderRoute();

    const pre = $('#preloader');
    const hide = () => { pre.classList.add('done'); setTimeout(() => pre.remove(), 700); document.body.classList.add('ready'); maybeShowNewsletterPopup(); };
    if (reduceMotion) hide(); else setTimeout(hide, 1100);
  }

  boot();
})();
