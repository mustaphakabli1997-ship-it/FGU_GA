/* ==========================================================================
   YOUZ — scripts communs (icônes, header, catalogue, contact, livraison)
   Pas de dépendance, fonctionne aussi en ouvrant index.html directement.
   ========================================================================== */
(function () {
  "use strict";

  var C = window.YOUZ_CONFIG || {};
  var WIL = window.YOUZ_WILAYAS || [];
  var PRODUCTS = window.YOUZ_PRODUCTS || [];

  /* ---------- petits utilitaires ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) {
    return Number(n).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " DA";
  }
  function icon(name, cls) {
    return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function waLink(text) {
    return "https://wa.me/" + C.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function zoneOf(code) {
    for (var i = 0; i < WIL.length; i++) if (WIL[i][0] === Number(code)) return WIL[i][2];
    return null;
  }
  /* frais de livraison (DA) ; null si wilaya inconnue */
  function fee(code, type, subtotal) {
    var z = zoneOf(code);
    if (!z || !C.delivery || !C.delivery[z]) return null;
    if (C.freeDeliveryOver > 0 && subtotal >= C.freeDeliveryOver) return 0;
    return C.delivery[z][type];
  }

  window.YOUZ = { $: $, $$: $$, esc: esc, fmt: fmt, icon: icon, waLink: waLink, fee: fee, zoneOf: zoneOf };

  /* ---------- sprite d'icônes ---------- */
  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">' +
    '<symbol id="i-star" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 1c.6 5.6 5.4 10.4 11 11-5.6.6-10.4 5.4-11 11-.6-5.6-5.4-10.4-11-11C6.6 11.4 11.4 6.6 12 1z"/></symbol>' +
    '<symbol id="i-truck" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></symbol>' +
    '<symbol id="i-package" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>' +
    '<symbol id="i-repeat" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></symbol>' +
    '<symbol id="i-home" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></symbol>' +
    '<symbol id="i-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>' +
    '<symbol id="i-minus" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></symbol>' +
    '<symbol id="i-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></symbol>' +
    '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>' +
    '<symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><g transform="translate(7.2 7.2) scale(.4)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="3"/></g></symbol>' +
    '<symbol id="i-instagram" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></symbol>' +
    '<symbol id="i-facebook" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></symbol>' +
    '<symbol id="i-tiktok" viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.2 4.5 5 4.7"/></symbol>' +
    "</svg>";
  document.body.insertAdjacentHTML("afterbegin", SPRITE);

  /* ---------- bandeau défilant ---------- */
  var mq = $("#marquee");
  if (mq && C.announcement && C.announcement.length) {
    var items = C.announcement.map(function (t) {
      return "<span class=\"marquee__item\">" + esc(t) + icon("star", "i--fill") + "</span>";
    }).join("");
    // 2 groupes identiques (x2 pour couvrir les grands écrans) => boucle sans couture
    var group = items + items;
    mq.innerHTML = '<div class="marquee__track">' + group + group + "</div>";
  }

  /* ---------- menu mobile ---------- */
  var burger = $(".burger"), nav = $("#nav");
  if (burger && nav) {
    var closeNav = function () { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); };
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- contact & réseaux (masqués si non configurés) ---------- */
  $$("[data-wa]").forEach(function (a) {
    var host = a.closest("[data-wa-host]") || a;
    if (!C.whatsapp) { host.hidden = true; return; }
    host.hidden = false; a.hidden = false;
    a.href = waLink(a.getAttribute("data-wa") || "Bonjour YOUZ, j'ai une question.");
    a.target = "_blank"; a.rel = "noopener";
  });
  $$("[data-social]").forEach(function (a) {
    var url = C.social && C.social[a.getAttribute("data-social")];
    var host = a.closest("[data-social-host]") || a;
    if (!url) { host.hidden = true; return; }
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  });
  var socialsBox = $(".socials");
  if (socialsBox && !$$("[data-social]", socialsBox).some(function (a) { return !a.hidden; })) socialsBox.hidden = true;
  $$("[data-phone]").forEach(function (el) {
    var host = el.closest("[data-phone-host]") || el;
    if (!C.phone) { host.hidden = true; return; }
    el.textContent = C.phone;
    if (el.tagName === "A") el.href = "tel:" + C.phone.replace(/[^\d+]/g, "");
  });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- apparition au scroll ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: .12, rootMargin: "0px 0px -40px 0px" }) : null;
  function reveal(root) {
    $$("[data-reveal]:not(.reveal)", root).forEach(function (el) {
      el.classList.add("reveal");
      if (io) io.observe(el); else el.classList.add("is-in");
    });
  }

  /* ---------- catalogue (page d'accueil) ---------- */
  var grid = $("#grid");
  function card(p) {
    var url = "produit.html?id=" + encodeURIComponent(p.id);
    var badge = p.soldOut ? "" :
      p.badge === "limited" ? '<span class="stamp">Limited Edition</span>' :
      p.badge === "new" ? '<span class="stamp stamp--solid">Nouveau</span>' : "";
    var sold = p.soldOut ? '<div class="sold"><span>Sold<br>out</span></div>' : "";
    var old = p.oldPrice > p.price ? "<s>" + fmt(p.oldPrice) + "</s>" : "";
    var cta = p.soldOut
      ? '<span class="btn btn--white btn--block" aria-disabled="true">Épuisé</span>'
      : '<a class="btn btn--white btn--block" href="' + url + '#commande">Commander</a>';
    return '<article class="card" data-reveal>' +
      '<a class="card__media" href="' + url + '" aria-label="Voir ' + esc(p.name) + '">' + badge + sold +
      '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '" width="434" height="499" loading="lazy" decoding="async"></a>' +
      '<div class="card__body"><h3 class="card__name"><a href="' + url + '">' + esc(p.name) + "</a></h3>" +
      '<p class="price">' + fmt(p.price) + old + "</p>" + cta + "</div></article>";
  }
  function renderGrid(filter) {
    var list = PRODUCTS.filter(function (p) { return filter === "all" || (p.tags || []).indexOf(filter) > -1; });
    grid.innerHTML = list.length ? list.map(card).join("") : '<p class="empty">Aucun modèle dans cette catégorie pour le moment.</p>';
    reveal(grid);
  }
  if (grid) {
    renderGrid("all");
    $$(".chip-filter").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".chip-filter").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        renderGrid(b.getAttribute("data-filter"));
      });
    });
  }

  /* carte produit vedette (hero) */
  var feat = $("#featured");
  if (feat && PRODUCTS[0]) {
    var f = PRODUCTS[0];
    feat.href = "produit.html?id=" + encodeURIComponent(f.id) + "#commande";
    $("img", feat).src = f.images[0];
    $("img", feat).alt = f.name;
    $("[data-f-name]", feat).textContent = f.name;
    $("[data-f-price]", feat).textContent = fmt(f.price);
  }

  /* ---------- tarifs de livraison ---------- */
  var zones = $("#zones");
  if (zones && C.delivery) {
    zones.innerHTML = Object.keys(C.delivery).map(function (k) {
      var z = C.delivery[k];
      return '<div class="zone" data-reveal><h3>' + esc(z.label) + "</h3><dl>" +
        "<div><dt>À domicile</dt><dd>" + fmt(z.home) + "</dd></div>" +
        "<div><dt>Stop Desk</dt><dd>" + fmt(z.desk) + "</dd></div></dl></div>";
    }).join("");
  }
  var free = $("#free-delivery");
  if (free) {
    if (C.freeDeliveryOver > 0) free.textContent = "Livraison offerte dès " + fmt(C.freeDeliveryOver) + " d'achat.";
    else free.hidden = true;
  }

  reveal(document);
})();
