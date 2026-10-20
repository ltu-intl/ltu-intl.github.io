/* ==========================================================================
   Luther University Int'l Education Institute — site behavior
   i18n switching, mobile nav, gallery lightbox, contact form
   ========================================================================== */

(function () {
  "use strict";

  var LANG_KEY = "ltu_lang";
  var DEFAULT_LANG = "ko";
  var SUPPORTED = ["ko", "en", "zh"];

  function getSavedLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage unavailable */ }
    return DEFAULT_LANG;
  }

  function saveLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  function applyLang(lang) {
    if (!window.I18N || !I18N[lang]) return;
    var dict = I18N[lang];

    document.documentElement.setAttribute("lang", lang);

    // Text content
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    // Inner HTML (for strings that include markup like <br>)
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    // Attributes, format: data-i18n-attr="placeholder:key1|title:key2"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      var pairs = el.getAttribute("data-i18n-attr").split("|");
      pairs.forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0], key = parts[1];
        if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
    });

    // Page <title>
    var titleKey = document.documentElement.getAttribute("data-page-title");
    if (titleKey && dict[titleKey]) document.title = dict[titleKey];

    // Active language button state
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
  }

  function initLangSwitch() {
    var lang = getSavedLang();
    applyLang(lang);
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var newLang = btn.getAttribute("data-lang");
        saveLang(newLang);
        applyLang(newLang);
      });
    });
  }

  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  function initGalleryLightbox() {
    var items = document.querySelectorAll(".gallery-item");
    var lightbox = document.querySelector(".lightbox");
    if (!items.length || !lightbox) return;
    var lightboxImg = lightbox.querySelector("img");
    var closeBtn = lightbox.querySelector(".lightbox-close");

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var img = item.querySelector("img");
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add("open");
      });
    });

    function close() { lightbox.classList.remove("open"); lightboxImg.src = ""; }
    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLangSwitch();
    initMobileNav();
    initGalleryLightbox();
  });
})();
