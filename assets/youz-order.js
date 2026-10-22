/* ==========================================================================
   YOUZ — استمارة الطلب (الدفع عند الاستلام فقط)
   YOUZ — formulaire de commande (PAIEMENT À LA LIVRAISON UNIQUEMENT)
   Utilisé sur la fiche produit (mode « page ») et sur l'accueil (mode « home »,
   avec choix du modèle).

   Flux : validation → panier vidé → redirection vers le checkout Shopify via
   un « cart permalink » qui contient :
     • la variante choisie (+ la variante « Frais de livraison » 400 / 600 DA)
     • les infos client pré-remplies (checkout[shipping_address][...])
     • les attributs/note de commande (Nom, Téléphone, Wilaya, Commune…)
   Le client n'a plus qu'à valider (mode de paiement : paiement à la livraison).
   ========================================================================== */
(function () {
  "use strict";

  var box = document.querySelector("[data-youz-order]");
  var form = document.getElementById("order-form");
  var productsEl = document.getElementById("YouzProducts");
  var configEl = document.getElementById("YouzConfig");
  if (!box || !form || !productsEl || !configEl) return;

  var products, cfg;
  try {
    products = JSON.parse(productsEl.textContent);
    cfg = JSON.parse(configEl.textContent);
  } catch (e) {
    if (window.console) console.error("[YOUZ] Configuration du formulaire invalide :", e);
    return;
  }
  if (!products.length) {
    form.hidden = true;
    var empty = document.createElement("p");
    empty.className = "order__sub";
    empty.textContent = "لا توجد موديلات متوفرة حاليًا.";
    form.parentNode.appendChild(empty);
    return;
  }

  var WIL = window.YOUZ_WILAYAS || [];
  var mode = box.getAttribute("data-mode") || "page";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) {
    return Number(n).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " " + (cfg.currency || "دج");
  }
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }

  var DELIVERY_LABEL = { home: "إلى المنزل", desk: "إلى المكتب (Stop Desk)" };

  /* ---------- frais de livraison : tarif → variante du produit « Frais de livraison » ---------- */
  var deliveryByPrice = {};
  (cfg.delivery || []).forEach(function (d) { if (d.available) deliveryByPrice[Math.round(d.price)] = d.id; });
  var deliveryReady = Object.keys(deliveryByPrice).length > 0;
  if (!deliveryReady && window.console) {
    console.warn("[YOUZ] منتج «مصاريف التوصيل» غير موجود أو بدون variants: لن تُضاف مصاريف التوصيل إلى الطلبية. راجع دليل التثبيت.");
  }
  function fee(type, subtotal) {
    if (!deliveryReady) return null;
    if (cfg.freeOver > 0 && subtotal >= cfg.freeOver) return 0;
    return Math.round(cfg.fees[type]);
  }

  /* ---------- wilayas ---------- */
  $("#wilaya").insertAdjacentHTML("beforeend", WIL.map(function (w) {
    return '<option value="' + w[0] + '">' + (w[0] < 10 ? "0" : "") + w[0] + " — " + esc(w[1]) + "</option>";
  }).join(""));
  function wilaya(code) {
    for (var i = 0; i < WIL.length; i++) if (String(WIL[i][0]) === String(code)) return WIL[i];
    return null;
  }
  function wilayaName(code) { var w = wilaya(code); return w ? w[1] : ""; }        // arabe (affichage)
  function wilayaLatin(code) { var w = wilaya(code); return w ? (w[2] || w[1]) : ""; } // latin (adresse transporteur)

  /* ---------- état : produit courant ---------- */
  var product = null;
  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function onlyDefault(p) { return p.variants.length === 1 && /^Default Title$/i.test(p.variants[0].options[0] || ""); }
  function defaultVariant() { return product.variants.filter(function (v) { return v.available; })[0] || product.variants[0]; }

  /* ---------- sélecteur de modèle (accueil) ---------- */
  function renderModels() {
    var host = $("#models");
    if (!host) return;
    host.innerHTML = products.map(function (p, i) {
      var min = Math.min.apply(null, p.variants.map(function (v) { return v.price; }));
      return '<label class="model"><input type="radio" name="model" value="' + i + '"' + (p === product ? " checked" : "") + ">" +
        '<span class="model__card">' + (p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" width="120" height="138">' : "") +
        "<b>" + esc(p.title) + "</b><em>" + fmt(min) + "</em></span></label>";
    }).join("");
  }

  /* ---------- options (pointure, couleur…) ---------- */
  function renderOptions() {
    var host = $("#options");
    if (onlyDefault(product)) { host.innerHTML = ""; return; }
    var pre = null;
    if (product.selected) pre = product.variants.filter(function (v) { return v.id === product.selected; })[0] || null;
    host.innerHTML = product.options.map(function (name, i) {
      var vals = [];
      product.variants.forEach(function (v) { if (vals.indexOf(v.options[i]) < 0) vals.push(v.options[i]); });
      var isSize = /pointure|taille|size|مقاس|قياس/i.test(name);
      var firstAvail = null;
      if (!isSize) {
        var f = product.variants.filter(function (v) { return v.available; })[0];
        firstAvail = f ? f.options[i] : vals[0];
      }
      return '<fieldset class="fieldset" id="f-option-' + (i + 1) + '" data-option-name="' + esc(name) + '"><legend>' + esc(name) + '</legend><div class="chips">' +
        vals.map(function (val) {
          var on = pre ? pre.options[i] === val : (!isSize && val === firstAvail);
          return '<label class="chip"><input type="radio" name="option-' + (i + 1) + '" value="' + esc(val) + '"' + (on ? " checked" : "") + "><span>" + esc(val) + "</span></label>";
        }).join("") + '</div><p class="err" role="alert"></p></fieldset>';
    }).join("");
  }

  function selectedOptions() {
    var out = [];
    for (var i = 1; i <= product.options.length; i++) out.push(checked("option-" + i));
    return out;
  }
  function currentVariant() {
    if (onlyDefault(product)) return product.variants[0];
    var sel = selectedOptions();
    if (sel.some(function (s) { return s === null; })) return null;
    for (var i = 0; i < product.variants.length; i++) {
      if (product.variants[i].options.every(function (o, j) { return o === sel[j]; })) return product.variants[i];
    }
    return null;
  }
  function chipAvailable(optIndex, value) {
    var sel = selectedOptions();
    return product.variants.some(function (v) {
      if (!v.available || v.options[optIndex] !== value) return false;
      return sel.every(function (s, j) { return j === optIndex || s === null || v.options[j] === s; });
    });
  }
  function refreshChips() {
    if (onlyDefault(product)) return;
    for (var i = 1; i <= product.options.length; i++) {
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
      options: onlyDefault(product) ? [] : selectedOptions(),
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
  function update() {
    refreshChips();
    var s = read();
    var unit = s.variant || defaultVariant();
    var sub = unit.price * s.qty;
    var f = fee(s.type, sub);

    // prix affiché sur la fiche produit
    setText("#p-price", fmt(unit.price));
    var old = $("#p-old"), save = $("#p-save");
    if (old && save) {
      if (unit.compare > unit.price) {
        old.hidden = false; old.textContent = fmt(unit.compare);
        save.hidden = false; save.textContent = "-" + Math.round((1 - unit.price / unit.compare) * 100) + "%";
      } else { old.hidden = true; save.hidden = true; }
    }
    setText("#s-price", fmt(unit.price));
    if (s.variant && s.variant.image) document.dispatchEvent(new CustomEvent("youz:variantimage", { detail: { url: s.variant.image, alt: product.title + " — " + s.variant.title } }));

    ["home", "desk"].forEach(function (t) {
      var v = fee(t, sub);
      setText("#fee-" + t, v === null ? "عند الطلب" : v === 0 ? "مجاني" : fmt(v));
    });
    $("#f-address").hidden = s.type === "desk";

    setText("#sum-label", product.title + " × " + s.qty);
    setText("#sum-sub", fmt(sub));
    var feeEl = $("#sum-fee");
    feeEl.textContent = f === null ? "تُحسب في الخطوة التالية" : f === 0 ? "مجاني" : fmt(f);
    feeEl.classList.toggle("free", f === 0);
    setText("#sum-total", f === null ? fmt(sub) + " + التوصيل" : fmt(sub + f));
    var label = $("#submit-label");
    label.textContent = f === null ? label.getAttribute("data-default") : "تأكيد الطلب · " + fmt(sub + f);

    var wa = $("#wa-order");
    if (wa && cfg.whatsapp) wa.href = "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(waMessage(s, sub, f));
    return { s: s, sub: sub, fee: f, total: sub + (f || 0), unit: unit };
  }
  $("#submit-label").setAttribute("data-default", $("#submit-label").textContent);

  function waMessage(s, sub, f) {
    var lines = ["السلام عليكم، أريد أن أطلب (الدفع عند الاستلام) :", "• الموديل : " + product.title];
    product.options.forEach(function (name, i) { if (s.options[i]) lines.push("• " + name + " : " + s.options[i]); });
    lines.push("• الكمية : " + s.qty);
    if (s.wilaya) lines.push("• الولاية : " + wilayaName(s.wilaya));
    if (s.commune) lines.push("• البلدية : " + s.commune);
    lines.push("• التوصيل : " + DELIVERY_LABEL[s.type]);
    lines.push("• المجموع : " + (f === null ? fmt(sub) + " + التوصيل" : fmt(sub + f)));
    if (s.name) lines.push("الاسم : " + s.name);
    if (s.phone) lines.push("الهاتف : " + s.phone);
    return lines.join("\n");
  }

  /* ---------- validation ---------- */
  function setErr(boxId, msg) {
    var el = document.getElementById(boxId);
    if (!el) return;
    el.classList.toggle("has-error", !!msg);
    var e = $(".err", el);
    if (e) e.textContent = msg || "";
  }
  function validate(s) {
    var errs = [], boxes = [];
    function bad(id, msg, focusSel) { errs.push({ box: id, msg: msg, el: $(focusSel) }); }
    if (!onlyDefault(product)) {
      for (var i = 1; i <= product.options.length; i++) {
        boxes.push("f-option-" + i);
        if (s.options[i - 1] === null) {
          var fs = document.getElementById("f-option-" + i);
          bad("f-option-" + i, "اختر " + String(fs.getAttribute("data-option-name")) + ".", "#f-option-" + i + " input:not(:disabled)");
        }
      }
    }
    boxes.push("f-name", "f-phone", "f-wilaya", "f-commune", "f-address");
    if (s.name.length < 3 || !/[A-Za-zÀ-ɏ؀-ۿ]/.test(s.name)) bad("f-name", "أدخل الاسم واللقب.", "#name");
    if (!/^0[567]\d{8}$/.test(s.phone)) bad("f-phone", "رقم غير صحيح: 10 أرقام تبدأ بـ 05 أو 06 أو 07.", "#phone");
    if (!s.wilaya) bad("f-wilaya", "اختر الولاية.", "#wilaya");
    if (s.commune.length < 2) bad("f-commune", "أدخل البلدية.", "#commune");
    if (s.type === "home" && s.address.length < 6) bad("f-address", "أدخل العنوان الكامل.", "#address");
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
      "checkout[shipping_address][address2]=" + q("Wilaya " + (s.wilaya < 10 ? "0" : "") + s.wilaya + " - " + wilayaLatin(s.wilaya)),
      "checkout[shipping_address][city]=" + q(s.commune),
      "checkout[shipping_address][country]=Algeria",
      "checkout[shipping_address][phone]=" + q(s.phone)
    ];
    var attrs = {
      "الاسم": s.name,
      "الهاتف": s.phone,
      "الولاية": (s.wilaya < 10 ? "0" : "") + s.wilaya + " - " + wilaya + " (" + wilayaLatin(s.wilaya) + ")",
      "البلدية": s.commune,
      "التوصيل": DELIVERY_LABEL[s.type],
      "العنوان": s.type === "home" ? s.address : "Stop Desk",
      "الدفع": "عند الاستلام (نقدًا)"
    };
    Object.keys(attrs).forEach(function (k) { params.push("attributes[" + q(k) + "]=" + q(attrs[k])); });
    params.push("note=" + q("الدفع عند الاستلام — " + s.name + " — " + s.phone + " — " + wilaya + " / " + s.commune + " — " + DELIVERY_LABEL[s.type]));
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
      showMsg("هذا الاختيار غير متوفر. اختر خيارًا آخر.");
      return;
    }
    if (calc.fee > 0 && !deliveryByPrice[calc.fee]) {
      if (window.console) console.error("[YOUZ] لا يوجد variant في «مصاريف التوصيل» بسعر " + calc.fee + " دج.");
      showMsg("سعر التوصيل غير متوفر حاليًا. تواصل معنا لإتمام الطلب.");
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
  function selectProduct(p) {
    product = p;
    renderOptions();
    setErr("f-product", "");
    update();
  }
  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);
  function onChange(e) {
    if (e.target && e.target.name === "model") { selectProduct(products[parseInt(e.target.value, 10)]); return; }
    var el = e.target.closest && e.target.closest(".field, .fieldset");
    if (el && el.id) setErr(el.id, "");
    update();
  }
  $("#qty").addEventListener("blur", function () { this.value = clampQty(parseInt(this.value, 10)); update(); });
  $("#qty-minus").addEventListener("click", function () { $("#qty").value = clampQty(parseInt($("#qty").value, 10) - 1); update(); });
  $("#qty-plus").addEventListener("click", function () { $("#qty").value = clampQty(parseInt($("#qty").value, 10) + 1); update(); });

  /* barre « Commander » collante sur mobile (fiche produit), masquée quand le formulaire est visible */
  var sticky = $("#sticky");
  if (sticky) {
    document.body.classList.add("has-sticky");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { sticky.classList.toggle("is-on", !en[0].isIntersecting); }, { threshold: 0.08 }).observe(box);
    } else {
      sticky.classList.add("is-on");
    }
  }

  /* ---------- démarrage ---------- */
  var initial = products[0];
  if (mode === "home") {
    var wanted = new URLSearchParams(window.location.search).get("model");
    initial = products.filter(function (p) { return p.handle === wanted; })[0] || products[0];
  }
  product = initial;
  renderModels();
  renderOptions();
  update();
})();
