/* ==========================================================================
   YOUZ — page produit + formulaire de commande (paiement à la livraison)
   ========================================================================== */
(function () {
  "use strict";

  var Y = window.YOUZ, C = window.YOUZ_CONFIG || {}, WIL = window.YOUZ_WILAYAS || [];
  var $ = Y.$, $$ = Y.$$, esc = Y.esc, fmt = Y.fmt, icon = Y.icon;

  var id = new URLSearchParams(location.search).get("id");
  var product = (window.YOUZ_PRODUCTS || []).filter(function (p) { return p.id === id; })[0];
  if (!product) {
    $("#nf").hidden = false;
    $("#crumb").textContent = "Introuvable";
    document.title = "Modèle introuvable — YOUZ Streetwear";
    return;
  }
  $("#pdp").hidden = false;

  var form = $("#order-form");
  var DELIVERY_LABEL = { home: "À domicile", desk: "Stop Desk" };
  var started = false;

  /* ---------- suivi optionnel (Meta Pixel / GA4 si vous les ajoutez au site) ---------- */
  function track(meta, ga, data) {
    try {
      if (window.fbq) window.fbq("track", meta, data.meta);
      if (window.gtag) window.gtag("event", ga, data.ga);
    } catch (e) { /* le suivi ne doit jamais bloquer la commande */ }
  }

  /* ---------- SEO / partage ---------- */
  function abs(p) { return new URL(p, location.href).href; }
  function setMeta(sel, val) { var el = $(sel); if (el) el.setAttribute("content", val); }
  var pageTitle = product.name + " — YOUZ Streetwear · Livraison 58 wilayas";
  document.title = pageTitle;
  setMeta('meta[name="description"]', product.name + " à " + fmt(product.price) + ". Livraison dans les 58 wilayas d'Algérie, paiement à la livraison.");
  setMeta('meta[property="og:title"]', product.name + " — YOUZ Streetwear");
  setMeta('meta[property="og:description"]', fmt(product.price) + " · Livraison 58 wilayas · Paiement à la livraison");
  setMeta('meta[property="og:image"]', abs(product.images[0]));
  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    description: product.short, image: product.images.map(abs), brand: { "@type": "Brand", name: "YOUZ" },
    offers: {
      "@type": "Offer", priceCurrency: "DZD", price: product.price, url: location.href,
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  });
  document.head.appendChild(ld);

  /* ---------- fiche produit ---------- */
  $("#crumb").textContent = product.name;
  $("#p-name").textContent = product.name;
  $("#p-price").textContent = fmt(product.price);
  if (product.oldPrice > product.price) {
    $("#p-old").hidden = false; $("#p-old").textContent = fmt(product.oldPrice);
    $("#p-save").hidden = false; $("#p-save").textContent = "-" + Math.round((1 - product.price / product.oldPrice) * 100) + "%";
  }
  $("#p-short").textContent = product.short || "";
  $("#p-feat").innerHTML = (product.features || []).map(function (f) { return "<li>" + icon("check") + esc(f) + "</li>"; }).join("");

  var badge = $("#p-badge");
  if (!product.soldOut && (product.badge === "limited" || product.badge === "new")) {
    badge.hidden = false;
    badge.textContent = product.badge === "limited" ? "Limited Edition" : "Nouveau";
    if (product.badge === "new") badge.classList.add("stamp--solid");
  }

  /* galerie */
  var imgs = product.images || [];
  var mainImg = $("#p-img"), thumbs = $("#p-thumbs");
  function showImg(i) {
    mainImg.src = imgs[i];
    mainImg.alt = product.name + " — vue " + (i + 1);
    $$("button", thumbs).forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
  }
  if (imgs.length > 1) {
    thumbs.innerHTML = imgs.map(function (src, i) {
      return '<button type="button" aria-label="Voir la photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
    }).join("");
    $$("button", thumbs).forEach(function (b, i) { b.addEventListener("click", function () { showImg(i); }); });
  } else {
    thumbs.hidden = true;
  }
  showImg(0);

  /* ---------- épuisé ---------- */
  if (product.soldOut) {
    form.hidden = true;
    $(".order__sub").textContent = "Ce modèle est actuellement épuisé. Découvrez le reste de la collection.";
    $(".order__sub").insertAdjacentHTML("afterend", '<a class="btn btn--white btn--block" href="index.html#boutique">Voir la collection</a>');
    $(".sticky-cta").hidden = true;
    return;
  }

  /* ---------- pointures / couleurs / wilayas ---------- */
  $("#sizes").innerHTML = (product.sizes || []).map(function (s) {
    var off = (product.soldOutSizes || []).indexOf(s) > -1;
    return '<label class="chip"><input type="radio" name="size" value="' + s + '"' + (off ? " disabled" : "") +
      ' aria-label="Pointure ' + s + (off ? " (épuisée)" : "") + '"><span>' + s + "</span></label>";
  }).join("");

  var colors = product.colors || [];
  if (colors.length > 1) {
    $("#f-color").hidden = false;
    $("#colors").innerHTML = colors.map(function (c, i) {
      return '<label class="chip chip--color"><input type="radio" name="color" value="' + esc(c.name) + '"' + (i === 0 ? " checked" : "") +
        '><span><i style="--sw:' + esc(c.hex) + '"></i>' + esc(c.name) + "</span></label>";
    }).join("");
  }

  $("#wilaya").insertAdjacentHTML("beforeend", WIL.map(function (w) {
    return '<option value="' + w[0] + '">' + (w[0] < 10 ? "0" : "") + w[0] + " — " + esc(w[1]) + "</option>";
  }).join(""));

  /* ---------- lecture du formulaire ---------- */
  function normPhone(v) {
    var s = String(v || "")
      .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x0660; })   // chiffres arabes-indiens
      .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x06F0; })
      .replace(/[\s.\-()]/g, "");
    if (s.indexOf("+213") === 0) s = "0" + s.slice(4);
    else if (s.indexOf("00213") === 0) s = "0" + s.slice(5);
    else if (s.indexOf("213") === 0 && s.length === 12) s = "0" + s.slice(3);
    return s;
  }
  function clampQty(n) { return isNaN(n) ? 1 : Math.max(1, Math.min(10, n)); }
  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }

  function read() {
    return {
      size: checked("size"),
      color: colors.length > 1 ? checked("color") : (colors[0] && colors[0].name) || "",
      qty: clampQty(parseInt($("#qty").value, 10)),
      name: $("#name").value.trim(),
      phone: normPhone($("#phone").value),
      wilaya: $("#wilaya").value,
      commune: $("#commune").value.trim(),
      type: checked("type") || "home",
      address: $("#address").value.trim()
    };
  }
  function wilayaName(code) {
    for (var i = 0; i < WIL.length; i++) if (String(WIL[i][0]) === String(code)) return WIL[i][1];
    return "";
  }

  /* ---------- récapitulatif en direct ---------- */
  function update() {
    var s = read();
    var sub = product.price * s.qty;
    var f = s.wilaya ? Y.fee(s.wilaya, s.type, sub) : null;

    ["home", "desk"].forEach(function (t) {
      var v = s.wilaya ? Y.fee(s.wilaya, t, sub) : null;
      $("#fee-" + t).textContent = v === null ? "Selon wilaya" : v === 0 ? "Offerte" : fmt(v);
    });
    $("#f-address").hidden = s.type === "desk";

    $("#sum-label").textContent = product.name + " × " + s.qty;
    $("#sum-sub").textContent = fmt(sub);
    var feeEl = $("#sum-fee");
    feeEl.textContent = f === null ? "Choisissez votre wilaya" : f === 0 ? "Offerte" : fmt(f);
    feeEl.classList.toggle("free", f === 0);
    $("#sum-total").textContent = f === null ? fmt(sub) + " + livraison" : fmt(sub + f);
    $("#submit-label").textContent = f === null ? "Confirmer la commande" : "Confirmer · " + fmt(sub + f);
    $("#s-name").textContent = product.name;
    $("#s-price").textContent = fmt(product.price);

    var wa = $("#wa-order");
    if (wa && C.whatsapp) wa.href = Y.waLink(waMessage(s, sub, f));
    return { s: s, sub: sub, fee: f, total: sub + (f || 0) };
  }

  function waMessage(s, sub, f, orderId) {
    var lines = ["Bonjour YOUZ, je souhaite commander :", "• Modèle : " + product.name];
    if (s.size) lines.push("• Pointure : " + s.size);
    if (colors.length > 1 && s.color) lines.push("• Couleur : " + s.color);
    lines.push("• Quantité : " + s.qty);
    if (s.wilaya) lines.push("• Wilaya : " + wilayaName(s.wilaya));
    if (s.commune) lines.push("• Commune : " + s.commune);
    lines.push("• Livraison : " + DELIVERY_LABEL[s.type]);
    lines.push("• Total : " + (f === null ? fmt(sub) + " + livraison" : fmt(sub + f)));
    if (s.name) lines.push("Nom : " + s.name);
    if (s.phone) lines.push("Téléphone : " + s.phone);
    if (orderId) lines.push("Réf. commande : " + orderId);
    return lines.join("\n");
  }

  /* ---------- validation ---------- */
  function setErr(boxId, msg) {
    var box = $("#" + boxId);
    if (!box) return;
    box.classList.toggle("has-error", !!msg);
    var e = $(".err", box);
    if (e) e.textContent = msg || "";
  }
  function validate(s) {
    var errs = [];
    function bad(box, msg, focusSel) { errs.push({ box: box, msg: msg, el: $(focusSel) }); }
    if (!s.size) bad("f-size", "Choisissez votre pointure.", 'input[name="size"]:not(:disabled)');
    if (s.name.length < 3 || !/[A-Za-zÀ-ɏ؀-ۿ]/.test(s.name)) bad("f-name", "Entrez votre nom et prénom.", "#name");
    if (!/^0[567]\d{8}$/.test(s.phone)) bad("f-phone", "Numéro invalide : 10 chiffres commençant par 05, 06 ou 07.", "#phone");
    if (!s.wilaya) bad("f-wilaya", "Choisissez votre wilaya.", "#wilaya");
    if (s.commune.length < 2) bad("f-commune", "Entrez votre commune.", "#commune");
    if (s.type === "home" && s.address.length < 6) bad("f-address", "Entrez votre adresse complète.", "#address");
    ["f-size", "f-name", "f-phone", "f-wilaya", "f-commune", "f-address"].forEach(function (b) {
      var hit = errs.filter(function (e) { return e.box === b; })[0];
      setErr(b, hit ? hit.msg : "");
    });
    return errs;
  }

  /* ---------- envoi ---------- */
  function newOrderId() {
    return "YZ-" + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).toUpperCase().slice(2, 5);
  }
  function buildOrder(calc) {
    var s = calc.s;
    return {
      orderId: newOrderId(),
      createdAt: new Date().toISOString(),
      productId: product.id, productName: product.name, unitPrice: product.price,
      size: s.size, color: s.color, qty: s.qty,
      subtotal: calc.sub, deliveryType: DELIVERY_LABEL[s.type], deliveryFee: calc.fee, total: calc.total,
      name: s.name, phone: s.phone,
      wilayaCode: Number(s.wilaya), wilaya: wilayaName(s.wilaya), commune: s.commune,
      address: s.type === "home" ? s.address : "",
      page: location.href
    };
  }
  function sendOrder(order) {
    if (!C.orderEndpoint) {  // MODE DÉMO : rien n'est envoyé
      try {
        var k = "youz_demo_orders", a = JSON.parse(localStorage.getItem(k) || "[]");
        a.push(order); localStorage.setItem(k, JSON.stringify(a));
      } catch (e) { /* stockage indisponible */ }
      if (window.console) console.info("[YOUZ] MODE DÉMO — commande non envoyée :", order);
      return Promise.resolve({ demo: true });
    }
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    // text/plain + no-cors : évite la pré-requête CORS vers Google Apps Script
    return fetch(C.orderEndpoint, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(order),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function () { return { demo: false }; })
      .then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
  }

  var dlg = $("#done");
  function showDone(order, demo) {
    $("#done-name").textContent = order.name.split(/\s+/)[0];
    $("#done-box").innerHTML =
      "<div><span>N° de commande</span><b>" + esc(order.orderId) + "</b></div>" +
      "<div><span>Modèle</span><b>" + esc(order.productName) + " · " + esc(order.size) + " × " + order.qty + "</b></div>" +
      "<div><span>Livraison</span><b>" + esc(order.deliveryType) + " · " + esc(order.wilaya) + "</b></div>" +
      "<div><span>Téléphone</span><b>" + esc(order.phone) + "</b></div>" +
      "<div><span>À payer à la livraison</span><b>" + fmt(order.total) + "</b></div>";
    $("#done-demo").hidden = !demo;
    var wa = $("#done-wa");
    if (wa && C.whatsapp) {
      var s = { size: order.size, color: order.color, qty: order.qty, wilaya: order.wilayaCode, commune: order.commune, type: order.deliveryType === "Stop Desk" ? "desk" : "home", name: order.name, phone: order.phone };
      wa.href = Y.waLink(waMessage(s, order.subtotal, order.deliveryFee, order.orderId));
    }
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }
  $("#done-x").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  var sending = false;
  function setLoading(on) {
    sending = on;
    var b = $("#submit");
    b.classList.toggle("is-loading", on);
    b.disabled = on;
  }
  function showMsg(text) {
    var m = $("#order-msg");
    m.textContent = text;
    m.classList.toggle("is-on", !!text);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    showMsg("");

    var calc = update();
    if (form.elements.website.value) {  // champ piège rempli => robot : on fait semblant
      showDone(buildOrder(calc), false);
      return;
    }
    var errs = validate(calc.s);
    if (errs.length) {
      var first = errs[0].el || $("#" + errs[0].box);
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      if (first.focus) first.focus({ preventScroll: true });
      return;
    }

    var order = buildOrder(calc);
    setLoading(true);
    sendOrder(order).then(function (res) {
      track("Purchase", "purchase", {
        meta: { value: order.total, currency: "DZD", content_ids: [product.id], content_type: "product" },
        ga: { transaction_id: order.orderId, value: order.total, currency: "DZD", items: [{ item_id: product.id, item_name: product.name, quantity: order.qty, price: order.unitPrice }] }
      });
      form.reset();
      update();
      showDone(order, res.demo);
    }).catch(function () {
      showMsg("Impossible d'envoyer la commande pour le moment. Vérifiez votre connexion et réessayez" +
        (C.whatsapp ? ", ou commandez via WhatsApp ci-dessous." : "."));
    }).then(function () { setLoading(false); });
  });

  /* ---------- interactions ---------- */
  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);
  function onChange(e) {
    var box = e.target.closest && e.target.closest(".field, .fieldset");
    if (box && box.id) setErr(box.id, "");
    if (!started) {
      started = true;
      track("InitiateCheckout", "begin_checkout", {
        meta: { value: product.price, currency: "DZD", content_ids: [product.id] },
        ga: { value: product.price, currency: "DZD", items: [{ item_id: product.id, item_name: product.name }] }
      });
    }
    update();
  }
  $("#qty").addEventListener("blur", function () { this.value = clampQty(parseInt(this.value, 10)); update(); });
  $("#qty-minus").addEventListener("click", function () { $("#qty").value = clampQty(parseInt($("#qty").value, 10) - 1); update(); });
  $("#qty-plus").addEventListener("click", function () { $("#qty").value = clampQty(parseInt($("#qty").value, 10) + 1); update(); });

  /* barre « Commander » collante sur mobile, masquée quand le formulaire est visible */
  var sticky = $("#sticky"), order = $("#commande");
  document.body.classList.add("has-sticky");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { sticky.classList.toggle("is-on", !en[0].isIntersecting); }, { threshold: .08 }).observe(order);
  } else {
    sticky.classList.add("is-on");
  }

  update();
  track("ViewContent", "view_item", {
    meta: { value: product.price, currency: "DZD", content_ids: [product.id], content_type: "product", content_name: product.name },
    ga: { value: product.price, currency: "DZD", items: [{ item_id: product.id, item_name: product.name, price: product.price }] }
  });
})();
