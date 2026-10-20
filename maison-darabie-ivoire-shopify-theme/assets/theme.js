/* Maison D'Arabie — Shopify theme behaviour (no dependencies).
   Everything is event-delegated so it survives the theme editor re-rendering sections. */
(function () {
  'use strict';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const theme = window.mdTheme || { routes: {}, strings: {}, cartType: 'drawer' };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const designMode = Boolean(window.Shopify && window.Shopify.designMode);

  // ----------------------------------------------------------------- layers
  const layers = [];
  function openLayer(el, focusSel) {
    if (!el || !el.hidden) return;
    el.hidden = false;
    layers.push(el);
    if (el.id === 'cart-drawer') $('#scrim').hidden = false;
    document.body.classList.add('lock');
    requestAnimationFrame(() => {
      el.classList.add('open');
      if (el.id === 'cart-drawer') $('#scrim').classList.add('open');
      const target = (focusSel && $(focusSel, el)) || $('button, [href], input', el);
      if (target) target.focus({ preventScroll: true });
    });
  }
  function closeLayer(el) {
    if (!el || el.hidden) return;
    el.classList.remove('open');
    layers.splice(layers.indexOf(el), 1);
    if (el.id === 'cart-drawer') $('#scrim').classList.remove('open');
    setTimeout(() => {
      el.hidden = true;
      if (el.id === 'cart-drawer') $('#scrim').hidden = true;
      if (!layers.length) document.body.classList.remove('lock');
    }, 320);
  }

  // ------------------------------------------------------------------ toast
  function toast(message, isError) {
    const el = document.createElement('div');
    el.className = 'toast';
    if (isError) el.style.borderInlineStartColor = '#ff5d5d';
    el.textContent = message;
    $('#toasts').append(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, 3000);
  }

  // ------------------------------------------------------------------- cart
  const json = async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status >= 400) throw new Error(data.description || data.message || theme.strings.updateError);
    return data;
  };

  function setCount(count) {
    $$('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = !count; });
  }

  function renderDrawer(html) {
    if (!html) return;
    const fresh = $('#cart-drawer', new DOMParser().parseFromString(html, 'text/html'));
    const live = $('#cart-drawer');
    if (fresh && live) live.innerHTML = fresh.innerHTML;
  }

  async function refreshCart(sectionHtml) {
    if (sectionHtml) renderDrawer(sectionHtml);
    else renderDrawer(await (await fetch(`${theme.routes.cart}?section_id=cart-drawer`)).text());
    const cart = await json(await fetch(theme.routes.cartJson, { headers: { Accept: 'application/json' } }));
    setCount(cart.item_count);
  }

  async function addToCart(form) {
    const body = new FormData(form);
    body.append('sections', 'cart-drawer');
    body.append('sections_url', window.location.pathname);
    const data = await json(await fetch(`${theme.routes.cartAdd}.js`, { method: 'POST', body, headers: { Accept: 'application/json' } }));
    await refreshCart(data.sections && data.sections['cart-drawer']);
    return data;
  }

  async function changeLine(line, quantity) {
    const data = await json(await fetch(`${theme.routes.cartChange}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line, quantity, sections: 'cart-drawer', sections_url: window.location.pathname }),
    }));
    setCount(data.item_count);
    if ($('[data-cart-page]')) { window.location.reload(); return; }
    renderDrawer(data.sections && data.sections['cart-drawer']);
  }

  // ---------------------------------------------------------------- product
  function productState(root) {
    const dataEl = $('[data-variants]', root);
    return { variants: dataEl ? JSON.parse(dataEl.textContent) : [] };
  }

  function currentVariant(root, variants) {
    const chosen = [];
    $$('input[type="radio"][data-position]:checked', root).forEach((input) => { chosen[Number(input.dataset.position) - 1] = input.value; });
    return variants.find((v) => chosen.every((value, i) => v[`option${i + 1}`] === value)) || null;
  }

  function showMedia(root, mediaId, { scroll = true } = {}) {
    if (!mediaId) return;
    const slides = $$('.stage-slide', root);
    const slide = slides.find((s) => s.dataset.mediaId === String(mediaId));
    if (!slide) return;
    slides.forEach((s) => s.classList.toggle('is-active', s === slide));
    $$('[data-thumb]', root).forEach((t) => t.classList.toggle('on', t.dataset.thumb === String(mediaId)));
    // on phones the photos form a swipeable strip: slide it sideways (never scrolls the page itself)
    const stage = slide.parentElement;
    if (scroll && stage && stage.scrollWidth > stage.clientWidth + 4) {
      stage.scrollBy({ left: slide.getBoundingClientRect().left - stage.getBoundingClientRect().left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function updateVariant(root) {
    const { variants } = productState(root);
    const variant = currentVariant(root, variants);
    const addBtn = $('[data-add-button]', root);
    const label = $('[data-add-label]', root);
    const buyNow = $('[data-buy-now]', root);
    const sticky = $('[data-sticky-add]', root);

    $$('[data-option]', root).forEach((fs) => {
      const checked = $('input:checked', fs);
      const out = $('[data-option-label]', fs);
      if (out && checked) out.textContent = checked.value;
    });

    const available = Boolean(variant && variant.available);
    [addBtn, buyNow, sticky].forEach((b) => { if (b) b.disabled = !available; });
    if (label && addBtn) {
      label.textContent = !variant ? addBtn.dataset.textUnavailable : available ? addBtn.dataset.textAdd : addBtn.dataset.textSold;
    }
    if (!variant) return;

    const idInput = $('[data-variant-id]', root);
    if (idInput) idInput.value = variant.id;
    const priceTpl = $(`template[data-price-for="${variant.id}"]`, root);
    if (priceTpl) {
      const priceEl = $('[data-price]', root);
      if (priceEl) priceEl.innerHTML = priceTpl.innerHTML;
      const stickyPrice = $('[data-sticky-price]', root);
      if (stickyPrice) stickyPrice.innerHTML = priceTpl.innerHTML;
    }
    showMedia(root, variant.featured_media && variant.featured_media.id);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  }

  async function submitProduct(root, { buyNow = false } = {}) {
    const form = $('[data-product-form]', root);
    if (!form) return;
    const err = $('[data-form-error]', root);
    if (err) err.hidden = true;
    const buttons = [$('[data-add-button]', root), $('[data-buy-now]', root), $('[data-sticky-add]', root)].filter(Boolean);
    buttons.forEach((b) => { b.disabled = true; b.setAttribute('aria-busy', 'true'); });
    try {
      await addToCart(form);
      if (buyNow) { window.location.href = '/checkout'; return; }
      toast(theme.strings.added);
      if (theme.cartType === 'drawer') openLayer($('#cart-drawer'));
      else window.location.href = theme.routes.cart;
    } catch (e) {
      if (err) { err.textContent = e.message; err.hidden = false; } else toast(e.message, true);
    } finally {
      buttons.forEach((b) => b.removeAttribute('aria-busy'));
      updateVariant(root);
    }
  }

  // Gift wrap checkbox and order note are saved straight away, so they survive the drawer being re-rendered.
  async function saveCartFields(payload) {
    try {
      await json(await fetch(theme.routes.cartUpdate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }));
    } catch (e) { toast(e.message, true); }
  }

  // ---------------------------------------------------------------- effects
  let revealObserver;
  function initReveal(scope = document) {
    const els = $$('.reveal:not(.in)', scope);
    if (!('IntersectionObserver' in window) || reduceMotion || designMode) { els.forEach((el) => el.classList.add('in')); return; }
    revealObserver = revealObserver || new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => revealObserver.observe(el));
  }

  function initHero(scope = document) {
    const hero = $('[data-hero]', scope);
    if (!hero || hero.dataset.bound || reduceMotion || matchMedia('(hover: none)').matches) return;
    hero.dataset.bound = '1';
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    });
  }

  // announcement bar: messages take turns (static when reduced motion is requested)
  function initAnnounce(scope = document) {
    $$('[data-announce]', scope).forEach((bar) => {
      if (bar.dataset.bound) return;
      bar.dataset.bound = '1';
      const msgs = $$('.ann-msg', bar);
      if (msgs.length < 2 || reduceMotion || designMode) return;
      let i = 0;
      setInterval(() => {
        msgs[i].classList.remove('is-on');
        i = (i + 1) % msgs.length;
        msgs[i].classList.add('is-on');
      }, 4600);
    });
  }

  // horizontal product rail: arrows + progress line
  function initRails(scope = document) {
    $$('[data-rail]', scope).forEach((rail) => {
      if (rail.dataset.bound) return;
      rail.dataset.bound = '1';
      const section = rail.closest('section') || document;
      const track = $('.rail-track', rail);
      const bar = $('[data-rail-bar]', section);
      const prev = $('[data-rail-prev]', section);
      const next = $('[data-rail-next]', section);
      const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
      const step = () => {
        const item = $('.rail-item', track);
        const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
        return item ? item.getBoundingClientRect().width + gap : 300;
      };
      const move = (d) => track.scrollBy({ left: d * rtl * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      if (prev) prev.addEventListener('click', () => move(-1));
      if (next) next.addEventListener('click', () => move(1));
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        const pos = Math.abs(track.scrollLeft);
        const width = max > 0 ? Math.max(12, (track.clientWidth / track.scrollWidth) * 100) : 100;
        if (bar) {
          bar.style.width = `${width}%`;
          bar.style.insetInlineStart = `${max > 0 ? (pos / max) * (100 - width) : 0}%`;
        }
        if (prev) prev.disabled = pos < 4;
        if (next) next.disabled = max <= 0 || pos > max - 4;
        section.classList.toggle('is-static', max <= 0);
      };
      track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  // universes list: the picture follows the row under the cursor / focus
  function initIndex(scope = document) {
    $$('[data-idx]', scope).forEach((idx) => {
      if (idx.dataset.bound) return;
      idx.dataset.bound = '1';
      const rows = $$('[data-idx-row]', idx);
      const views = $$('[data-idx-pv]', idx);
      const show = (n) => {
        rows.forEach((r) => r.classList.toggle('is-on', r.dataset.idxRow === n));
        views.forEach((v) => v.classList.toggle('is-on', v.dataset.idxPv === n));
      };
      rows.forEach((r) => ['mouseenter', 'focus'].forEach((ev) => r.addEventListener(ev, () => show(r.dataset.idxRow))));
    });
  }

  // product photos: the dots follow the swipe
  function initGallery(scope = document) {
    $$('[data-stage]', scope).forEach((stage) => {
      if (stage.dataset.bound || !('IntersectionObserver' in window)) return;
      stage.dataset.bound = '1';
      const root = stage.closest('[data-product-section]');
      const io = new IntersectionObserver((entries) => {
        if (stage.scrollWidth <= stage.clientWidth + 4) return;
        entries.forEach((en) => { if (en.isIntersecting && en.target.dataset.mediaId) showMedia(root, en.target.dataset.mediaId, { scroll: false }); });
      }, { root: stage, threshold: 0.6 });
      $$('.stage-slide', stage).forEach((s) => io.observe(s));
    });
  }

  // product page: the bottom buy bar shows once the real buy buttons have scrolled out of sight (above the screen)
  let stickyBars = [];
  function initStickyBuy(scope = document) {
    $$('[data-sticky-buy]', scope).forEach((bar) => {
      if (bar.dataset.bound) return;
      bar.dataset.bound = '1';
      const root = bar.closest('[data-product-section]');
      stickyBars.push({ bar, anchor: root && $('[data-product-form]', root) });
    });
    updateStickyBars();
  }
  function updateStickyBars() {
    stickyBars = stickyBars.filter(({ bar }) => bar.isConnected);
    stickyBars.forEach(({ bar, anchor }) => bar.classList.toggle('show', !anchor || anchor.getBoundingClientRect().bottom < 0));
  }

  function onScroll() {
    const header = $('[data-header]');
    if (header) header.classList.toggle('scrolled', window.scrollY > 24);
    updateStickyBars();
  }

  // ------------------------------------------------------- COD LeadForm (leadform-cod.com)
  // The LeadForm app puts its own order form under the buy buttons. The theme does two things for it:
  // "Commander maintenant" scrolls to that form instead of going to the checkout, and on an Arabic storefront the app's
  // French / English default labels are shown in Arabic (the app rewrites its own texts, so this runs again after every change).
  const LEADFORM_AR = {
    'Paiement à la livraison': 'الدفع عند الاستلام', 'Cash on Delivery': 'الدفع عند الاستلام',
    Panier: 'طلبيتك', Cart: 'طلبيتك', 'Sous-total': 'المجموع الفرعي', Subtotal: 'المجموع الفرعي', 'Réduction': 'التخفيض', Discount: 'التخفيض',
    Livraison: 'التوصيل', Shipping: 'التوصيل', Total: 'المجموع',
    'Prénom': 'الاسم الأول', 'First Name': 'الاسم الأول', 'Nom de famille': 'اللقب', 'Last Name': 'اللقب', Nom: 'الاسم', Name: 'الاسم', 'Nom complet': 'الاسم الكامل', 'Full Name': 'الاسم الكامل',
    'Téléphone': 'رقم الهاتف', Phone: 'رقم الهاتف', 'E-mail': 'البريد الإلكتروني', Email: 'البريد الإلكتروني',
    'Adresse ligne 1': 'العنوان', 'Adresse ligne 2': 'تفاصيل العنوان', Adresse: 'العنوان', 'Address Line 1': 'العنوان', 'Address Line 2': 'تفاصيل العنوان', Address: 'العنوان',
    Note: 'ملاحظة', 'Code postal': 'الرمز البريدي', 'Zip Code': 'الرمز البريدي', Pays: 'البلد', Country: 'البلد',
    wilaya: 'الولاية', Wilaya: 'الولاية', Province: 'الولاية', baladia: 'البلدية', Baladia: 'البلدية', Commune: 'البلدية', City: 'البلدية', Ville: 'المدينة',
    'Options de livraison': 'خيارات التوصيل', 'Delivery options': 'خيارات التوصيل', 'Shipping options': 'خيارات التوصيل',
    'Livraison gratuite': 'توصيل مجاني', 'Free Shipping': 'توصيل مجاني', GRATUIT: 'مجاني', Gratuit: 'مجاني', FREE: 'مجاني',
    'Livraison à domicile': 'التوصيل إلى المنزل', 'Home delivery': 'التوصيل إلى المنزل', 'Door Delivery': 'التوصيل إلى المنزل', 'Stop Desk': 'التوصيل إلى المكتب', 'Livraison au bureau': 'التوصيل إلى المكتب',
    'Commander Maintenant': 'اطلب الآن', 'Order Now': 'اطلب الآن', 'Ajouter au panier': 'أضف إلى السلة', 'Payer en ligne': 'ادفع عبر الإنترنت', Appliquer: 'تطبيق', 'Entrez le code promo': 'أدخل رمز الخصم',
    'Votre commande a été passée avec succès': 'تم تسجيل طلبك بنجاح', "Merci d'avoir acheté chez nous": 'شكرًا لثقتكم بنا',
    'Your order has been placed successfully': 'تم تسجيل طلبك بنجاح', 'Thank you for shopping with us': 'شكرًا لثقتكم بنا',
    Required: 'هذا الحقل مطلوب',
  };
  const LEADFORM_ROOTS = '#leadform-embedded-container, .leadform-popup-overlay, .leadform-sidebar-overlay, .leadform-thankyou-overlay, #lfcod-sticky';
  const isArabic = () => /^ar\b/i.test(document.documentElement.lang);

  function translateLeadform() {
    $$(LEADFORM_ROOTS).forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest('option, script, style') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const key = n.nodeValue.trim();
        const out = LEADFORM_AR[key] || (/^(Price|Prix)\s*:/i.test(key) ? key.replace(/^(Price|Prix)\s*:\s*/i, 'السعر: ') : '');
        if (out) n.nodeValue = n.nodeValue.replace(key, out);
      }
      $$('[data-required-message]', root).forEach((el) => { if (LEADFORM_AR[el.dataset.requiredMessage]) el.dataset.requiredMessage = LEADFORM_AR[el.dataset.requiredMessage]; });
    });
  }

  function initLeadform() {
    if (!theme.leadform || !isArabic()) return;
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; translateLeadform(); });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    translateLeadform();
  }

  function goToLeadform() {
    const form = theme.leadform && $('#leadform-embedded-container');
    if (!form) return false;
    form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    return true;
  }

  // ----------------------------------------------------------------- events
  document.addEventListener('click', (e) => {
    const t = e.target;

    if (t.closest('[data-menu-open]')) {
      openLayer($('#mobile-menu'));
      $('[data-menu-open]').setAttribute('aria-expanded', 'true');
      return;
    }
    if (t.closest('[data-menu-close]') || (t.closest('#mobile-menu a') && !t.closest('[data-menu-open]'))) {
      closeLayer($('#mobile-menu'));
      const opener = $('[data-menu-open]');
      if (opener) opener.setAttribute('aria-expanded', 'false');
      return;
    }
    if (t.closest('[data-search-open]')) { openLayer($('#search-overlay'), 'input'); return; }
    if (t.closest('[data-search-close]') || t.id === 'search-overlay') { closeLayer($('#search-overlay')); return; }

    const cartLink = t.closest('[data-cart-open]');
    if (cartLink && theme.cartType === 'drawer') {
      e.preventDefault();
      openLayer($('#cart-drawer'));
      return;
    }
    if (t.closest('[data-cart-close]') || t.id === 'scrim') { closeLayer($('#cart-drawer')); return; }

    const qty = t.closest('[data-qty-change]');
    if (qty) {
      qty.disabled = true;
      changeLine(Number(qty.dataset.line), Number(qty.dataset.qtyChange)).catch((err) => toast(err.message, true)).finally(() => { qty.disabled = false; });
      return;
    }

    const toggle = t.closest('[data-toggle]');
    if (toggle) {
      const target = $(toggle.dataset.toggle);
      if (target) toggle.setAttribute('aria-expanded', String(target.classList.toggle('is-open')));
      return;
    }

    const step = t.closest('[data-qty-step]');
    if (step) {
      const input = $('[data-qty-input]', step.closest('.qty'));
      input.value = Math.max(1, Math.min(20, Number(input.value || 1) + Number(step.dataset.qtyStep)));
      return;
    }

    const root = t.closest('[data-product-section]');
    if (root) {
      const thumb = t.closest('[data-thumb]');
      if (thumb) { showMedia(root, thumb.dataset.thumb); return; }
      if (t.closest('[data-buy-now]')) { if (!goToLeadform()) submitProduct(root, { buyNow: true }); return; }
      if (t.closest('[data-sticky-add]')) { submitProduct(root); return; }
    }

    const jump = t.closest('[data-scroll]');
    if (jump) {
      const target = $(jump.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    submitProduct(form.closest('[data-product-section]'));
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    const root = t.closest('[data-product-section]');
    if (root && t.matches('input[type="radio"][data-position]')) updateVariant(root);
    if (t.matches('[data-gift-wrap]')) saveCartFields({ attributes: { 'Emballage cadeau': t.checked ? 'Oui' : '' } });
    if (t.matches('[data-cart-note]')) saveCartFields({ note: t.value });
    if (t.matches('select[data-auto-submit]') && t.form) t.form.submit();
    const filters = t.closest('[data-auto-submit-form]');
    if (filters && !t.matches('select[data-auto-submit]')) filters.requestSubmit();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && layers.length) closeLayer(layers[layers.length - 1]);
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  // theme editor: re-run initialisers when a section is (re)loaded
  document.addEventListener('shopify:section:load', (e) => { initReveal(e.target); initHero(e.target); initAnnounce(e.target); initRails(e.target); initIndex(e.target); initGallery(e.target); initStickyBuy(e.target); onScroll(); });

  initReveal();
  initHero();
  initAnnounce();
  initRails();
  initIndex();
  initGallery();
  initStickyBuy();
  initLeadform();
  onScroll();
})();
