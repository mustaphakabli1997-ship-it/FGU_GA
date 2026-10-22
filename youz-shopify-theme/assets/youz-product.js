/* ==========================================================================
   YOUZ — page produit : formulaire de commande (paiement à la livraison)

   Flux : validation → panier vidé → redirection vers le checkout Shopify via
   un « cart permalink » qui contient :
     • la variante choisie (+ la variante « Frais de livraison » correspondante)
     • les infos client pré-remplies (checkout[shipping_address][...])
     • les attributs/note de commande (Nom, Téléphone, Wilaya, Commune…)
   Le client n'a plus qu'à valider (mode de paiement : paiement à la livraison).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("YouzOrder");
  var form = document.getElementById("order-form");
  var productEl = document.getElementById("YouzProduct");
  var configEl = document.getElementById("YouzConfig");
  if (!root || !form || !productEl || !configEl) return;

  var product, cfg;
  try {
    product = JSON.parse(productEl.textContent);
    cfg = JSON.parse(configEl.textContent);
  } catch (e) {
    if (window.console) console.error("[YOUZ] Configuration produit invalide :", e);
    return;
  }
  var WIL = window.YOUZ_WILAYAS || [];

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) {
    return Number(n).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " " + (cfg.currency || "DA");
  }

  var DELIVERY_LABEL = { home: "À domicile", desk: "Stop Desk" };

  /* ---------- frais de livraison : tarif → variante du produit « Frais de livraison » ---------- */
  var deliveryByPrice = {};
  (cfg.delivery || []).forEach(function (d) { if (d.available) deliveryByPrice[Math.round(d.price)] = d.id; });
  var deliveryReady = Object.keys(deliveryByPrice).length > 0;
  if (!deliveryReady && window.console) {
    console.warn("[YOUZ] Produit « Frais de livraison » introuvable ou sans variante : les frais ne seront PAS ajoutés à la commande. Voir le guide d'installation.");
  }

  function zoneOf(code) {
    for (var i = 0; i < WIL.length; i++) if (String(WIL[i][0]) === String(code)) return WIL[i][2];
    return null;
  }
  function wilayaName(code) {
    for (var i = 0; i < WIL.length; i++) if (String(WIL[i][0]) === String(code)) return WIL[i][1];
    return "";
  }
  function fee(code, type, subtotal) {
    if (!deliveryReady) return null;
    var z = zoneOf(code);
    if (!z || !cfg.fees[z]) return null;
    if (cfg.freeOver > 0 && subtotal >= cfg.freeOver) return 0;
    return Math.round(cfg.fees[z][type]);
  }

  /* ---------- wilayas ---------- */
  $("#wilaya").insertAdjacentHTML("beforeend", WIL.map(function (w) {
    return '<option value="' + w[0] + '">' + (w[0] < 10 ? "0" : "") + w[0] + " — " + esc(w[1]) + "</option>";
  }).join(""));

  /* ---------- galerie ---------- */
  var mainImg = $("#p-img");
  $$("#p-thumbs button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (mainImg) {
        mainImg.removeAttribute("srcset");
        mainImg.src = b.getAttribute("data-src");
        mainImg.alt = b.getAttribute("data-alt") || "";
      }
      $$("#p-thumbs button").forEach(function (x) { x.setAttribute("aria-current", x === b ? "true" : "false"); });
    });
  });

  /* ---------- variantes ---------- */
  var variants = product.variants;
  var nOptions = product.options.length;
  var defaultVariant = variants.filter(function (v) { return v.available; })[0] || variants[0];

  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function selectedOptions() {
    var out = [];
    for (var i = 1; i <= nOptions; i++) out.push(checked("option-" + i));
    return out;
  }
  function currentVariant() {
    var sel = selectedOptions();
    if (sel.some(function (s) { return s === null; })) return null;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].options.every(function (o, j) { return o === sel[j]; })) return variants[i];
    }
    return null;
  }
  function chipAvailable(optIndex, value) {
    var sel = selectedOptions();
    return variants.some(function (v) {
      if (!v.available || v.options[optIndex] !== value) return false;
      return sel.every(function (s, j) { return j === optIndex || s === null || v.options[j] === s; });
    });
  }
  function refreshChips() {
    for (var i = 1; i <= nOptions; i++) {
      $$('input[name="option-' + i + '"]', form).forEach(function (input) {
        var ok = chipAvailable(i - 1, input.value);
        input.disabled = !ok;
        if (!ok && input.checked) input.checked = false;
      });
    }
  }

  function clampQty(n) { return isNaN(n) ? 1 : Math.max(1, Math.min(10, n)); }
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

  function read() {
    return {
      variant: currentVariant(),
      options: selectedOptions(),
      qty: clampQty(parseInt($("#qty").value, 10)),
      name: $("#name").value.trim(),
      phone: normPhone($("#phone").value),
      wilaya: $("#wilaya").value,
      commune: $("#commune").value.trim(),
      type: checked("type") || "home",
      address: $("#address").value.trim()
    };
  }

  /* ---------- récapitulatif en direct ---------- */
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }
  function update() {
    refreshChips();
    var s = read();
    var unitVariant = s.variant || defaultVariant;
    var sub = unitVariant.price * s.qty;
    var f = s.wilaya ? fee(s.wilaya, s.type, sub) : null;

    // prix affiché
    setText("#p-price", fmt(unitVariant.price));
    var old = $("#p-old"), save = $("#p-save");
    if (unitVariant.compare > unitVariant.price) {
      old.hidden = false; old.textContent = fmt(unitVariant.compare);
      save.hidden = false; save.textContent = "-" + Math.round((1 - unitVariant.price / unitVariant.compare) * 100) + "%";
    } else { old.hidden = true; save.hidden = true; }
    setText("#s-price", fmt(unitVariant.price));

    ["home", "desk"].forEach(function (t) {
      var v = s.wilaya ? fee(s.wilaya, t, sub) : null;
      setText("#fee-" + t, v === null ? (deliveryReady ? "Selon wilaya" : "À la commande") : v === 0 ? "Offerte" : fmt(v));
    });
    $("#f-address").hidden = s.type === "desk";

    setText("#sum-label", product.title + " × " + s.qty);
    setText("#sum-sub", fmt(sub));
    var feeEl = $("#sum-fee");
    feeEl.textContent = f === null ? (deliveryReady ? "Choisissez votre wilaya" : "Calculée à l'étape suivante") : f === 0 ? "Offerte" : fmt(f);
    feeEl.classList.toggle("free", f === 0);
    setText("#sum-total", f === null ? fmt(sub) + " + livraison" : fmt(sub + f));
    var label = $("#submit-label");
    label.textContent = f === null ? label.getAttribute("data-default") : "Confirmer · " + fmt(sub + f);

    var wa = $("#wa-order");
    if (wa && cfg.whatsapp) wa.href = "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(waMessage(s, sub, f));
    return { s: s, sub: sub, fee: f, total: sub + (f || 0), unit: unitVariant };
  }
  $("#submit-label").setAttribute("data-default", $("#submit-label").textContent);

  function waMessage(s, sub, f) {
    var lines = ["Bonjour, je souhaite commander :", "• Modèle : " + product.title];
    product.options.forEach(function (name, i) { if (s.options[i]) lines.push("• " + name + " : " + s.options[i]); });
    lines.push("• Quantité : " + s.qty);
    if (s.wilaya) lines.push("• Wilaya : " + wilayaName(s.wilaya));
    if (s.commune) lines.push("• Commune : " + s.commune);
    lines.push("• Livraison : " + DELIVERY_LABEL[s.type]);
    lines.push("• Total : " + (f === null ? fmt(sub) + " + livraison" : fmt(sub + f)));
    if (s.name) lines.push("Nom : " + s.name);
    if (s.phone) lines.push("Téléphone : " + s.phone);
    return lines.join("\n");
  }

  /* ---------- validation ---------- */
  function setErr(boxId, msg) {
    var box = document.getElementById(boxId);
    if (!box) return;
    box.classList.toggle("has-error", !!msg);
    var e = $(".err", box);
    if (e) e.textContent = msg || "";
  }
  function validate(s) {
    var errs = [], boxes = [];
    function bad(box, msg, focusSel) { errs.push({ box: box, msg: msg, el: $(focusSel) }); }
    for (var i = 1; i <= nOptions; i++) {
      boxes.push("f-option-" + i);
      if (s.options[i - 1] === null) {
        var fs = document.getElementById("f-option-" + i);
        bad("f-option-" + i, "Choisissez votre " + String(fs.getAttribute("data-option-name")).toLowerCase() + ".", '#f-option-' + i + ' input:not(:disabled)');
      }
    }
    boxes.push("f-name", "f-phone", "f-wilaya", "f-commune", "f-address");
    if (s.name.length < 3 || !/[A-Za-zÀ-ɏ؀-ۿ]/.test(s.name)) bad("f-name", "Entrez votre nom et prénom.", "#name");
    if (!/^0[567]\d{8}$/.test(s.phone)) bad("f-phone", "Numéro invalide : 10 chiffres commençant par 05, 06 ou 07.", "#phone");
    if (!s.wilaya) bad("f-wilaya", "Choisissez votre wilaya.", "#wilaya");
    if (s.commune.length < 2) bad("f-commune", "Entrez votre commune.", "#commune");
    if (s.type === "home" && s.address.length < 6) bad("f-address", "Entrez votre adresse complète.", "#address");
    boxes.forEach(function (b) {
      var hit = errs.filter(function (e) { return e.box === b; })[0];
      setErr(b, hit ? hit.msg : "");
    });
    return errs;
  }

  /* ---------- envoi : cart permalink → checkout Shopify ---------- */
  function q(v) { return encodeURIComponent(v); }
  function buildCheckoutUrl(calc) {
    var s = calc.s;
    var items = [calc.variantId + ":" + s.qty];
    if (calc.fee > 0) items.push(deliveryByPrice[calc.fee] + ":1");
    var base = cfg.routes.root.replace(/\/$/, "") + "/cart/" + items.join(",");

    var tokens = s.name.split(/\s+/);
    var first = tokens[0], last = tokens.slice(1).join(" ") || tokens[0];
    var wilaya = wilayaName(s.wilaya);
    var params = [
      "checkout[shipping_address][first_name]=" + q(first),
      "checkout[shipping_address][last_name]=" + q(last),
      "checkout[shipping_address][address1]=" + q(s.type === "home" ? s.address : "STOP DESK — " + s.commune),
      "checkout[shipping_address][address2]=" + q("Wilaya " + wilaya),
      "checkout[shipping_address][city]=" + q(s.commune),
      "checkout[shipping_address][country]=Algeria",
      "checkout[shipping_address][phone]=" + q(s.phone)
    ];
    var attrs = {
      "Nom": s.name,
      "Téléphone": s.phone,
      "Wilaya": (s.wilaya < 10 ? "0" : "") + s.wilaya + " - " + wilaya,
      "Commune": s.commune,
      "Livraison": DELIVERY_LABEL[s.type],
      "Adresse": s.type === "home" ? s.address : "Stop Desk",
      "Paiement": "À la livraison (COD)"
    };
    Object.keys(attrs).forEach(function (k) { params.push("attributes[" + q(k) + "]=" + q(attrs[k])); });
    params.push("note=" + q("COD — " + s.name + " — " + s.phone + " — " + wilaya + " / " + s.commune + " — " + DELIVERY_LABEL[s.type]));
    return base + "?" + params.join("&");
  }

  function clearCart() {
    var done = new Promise(function (resolve) {
      try {
        fetch(cfg.routes.cartClear, { method: "POST", credentials: "same-origin" }).then(resolve, resolve);
      } catch (e) { resolve(); }
    });
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 4000); });
    return Promise.race([done, timeout]);
  }

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
    if (form.elements.website.value) return;   // champ piège rempli => robot

    var errs = validate(calc.s);
    if (errs.length) {
      var first = errs[0].el || document.getElementById(errs[0].box);
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      if (first.focus) first.focus({ preventScroll: true });
      return;
    }
    if (!calc.s.variant) {
      showMsg("Cette combinaison n'est pas disponible. Choisissez une autre option.");
      return;
    }
    if (calc.fee > 0 && !deliveryByPrice[calc.fee]) {
      if (window.console) console.error("[YOUZ] Aucune variante « Frais de livraison » au prix de " + calc.fee + " DA.");
      showMsg("Le tarif de livraison pour votre wilaya est momentanément indisponible. Contactez-nous pour passer commande.");
      return;
    }

    calc.variantId = calc.s.variant.id;
    setLoading(true);
    clearCart().then(function () {
      window.location.assign(buildCheckoutUrl(calc));
    });
  });

  // retour arrière depuis le checkout : on réactive le bouton
  window.addEventListener("pageshow", function (ev) { if (ev.persisted) setLoading(false); });

  /* ---------- interactions ---------- */
  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);
  function onChange(e) {
    var box = e.target.closest && e.target.closest(".field, .fieldset");
    if (box && box.id) setErr(box.id, "");
    update();
  }
  $("#qty").addEventListener("blur", function () { this.value = clampQty(parseInt(this.value, 10)); update(); });
  $("#qty-minus").addEventListener("click", function () { $("#qty").value = clampQty(parseInt($("#qty").value, 10) - 1); update(); });
  $("#qty-plus").addEventListener("click", function () { $("#qty").value = clampQty(parseInt($("#qty").value, 10) + 1); update(); });

  /* barre « Commander » collante sur mobile, masquée quand le formulaire est visible */
  var sticky = $("#sticky"), order = $("#commande");
  if (sticky && order) {
    document.body.classList.add("has-sticky");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { sticky.classList.toggle("is-on", !en[0].isIntersecting); }, { threshold: 0.08 }).observe(order);
    } else {
      sticky.classList.add("is-on");
    }
  }

  update();
})();
