/* YOUZ — scripts communs : menu mobile, apparition au scroll, tri des collections */
(function () {
  "use strict";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

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

  /* ---------- apparition au scroll ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  function reveal(root) {
    $$("[data-reveal]:not(.reveal)", root).forEach(function (el) {
      el.classList.add("reveal");
      if (io) io.observe(el); else el.classList.add("is-in");
    });
  }
  reveal(document);
  // l'éditeur de thème recharge les sections à la volée
  document.addEventListener("shopify:section:load", function (e) { reveal(e.target); });

  /* ---------- galerie produit : vignettes + photo de la couleur choisie ---------- */
  var mainImg = $("#p-img"), thumbs = $$("#p-thumbs button");
  function baseUrl(u) { return String(u || "").split("?")[0]; }
  function showImage(url, alt) {
    if (!mainImg || !url) return;
    mainImg.removeAttribute("srcset");
    mainImg.src = url;
    if (alt) mainImg.alt = alt;
    thumbs.forEach(function (b) { b.setAttribute("aria-current", baseUrl(b.getAttribute("data-src")) === baseUrl(url) ? "true" : "false"); });
  }
  thumbs.forEach(function (b) {
    b.addEventListener("click", function () { showImage(b.getAttribute("data-src"), b.getAttribute("data-alt")); });
  });
  var lastVariantImage = null;
  document.addEventListener("youz:variantimage", function (e) {
    var url = e.detail && e.detail.url;
    if (!url || baseUrl(url) === lastVariantImage) return;
    lastVariantImage = baseUrl(url);
    showImage(url, e.detail.alt);
  });

  /* ---------- tri des collections ---------- */
  var sort = $("#SortBy");
  if (sort) {
    sort.addEventListener("change", function () {
      var url = new URL(window.location.href);
      url.searchParams.set("sort_by", sort.value);
      url.searchParams.delete("page");
      window.location.href = url.toString();
    });
  }
})();
