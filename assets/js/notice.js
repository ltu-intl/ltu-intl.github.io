/* Public notice board: reads assets/data/notices.json (edited via admin.html) */
(function () {
  "use strict";

  var listEl = document.getElementById("notice-list");
  var detailEl = document.getElementById("notice-detail");
  var homeEl = document.getElementById("home-notices");
  if (!(listEl && detailEl) && !homeEl) return;

  function t(key, fallback) {
    var lang = document.documentElement.getAttribute("lang") || "ko";
    return (typeof I18N !== "undefined" && I18N[lang] && I18N[lang][key]) || fallback;
  }

  function sorted(items) {
    return items.slice().sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return (b.date || "").localeCompare(a.date || "") || (b.id || 0) - (a.id || 0);
    });
  }

  function renderList(items, target, limit) {
    if (detailEl) detailEl.hidden = true;
    target.hidden = false;
    target.textContent = "";
    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "notice-empty";
      empty.setAttribute("data-i18n", "notice.empty");
      empty.textContent = t("notice.empty", "등록된 공지사항이 없습니다.");
      target.appendChild(empty);
      return;
    }
    sorted(items).slice(0, limit || items.length).forEach(function (n) {
      var a = document.createElement("a");
      a.className = "notice-item" + (n.pinned ? " pinned" : "");
      a.href = "notice.html?id=" + encodeURIComponent(n.id);
      if (n.pinned) {
        var pin = document.createElement("span");
        pin.className = "notice-pin";
        pin.setAttribute("data-i18n", "notice.pinned");
        pin.textContent = t("notice.pinned", "공지");
        a.appendChild(pin);
      }
      var title = document.createElement("span");
      title.className = "notice-title";
      title.textContent = n.title;
      var date = document.createElement("span");
      date.className = "notice-date";
      date.textContent = n.date;
      a.appendChild(title);
      a.appendChild(date);
      target.appendChild(a);
    });
  }

  function renderDetail(n) {
    listEl.hidden = true;
    detailEl.hidden = false;
    document.getElementById("nd-title").textContent = n.title;
    document.getElementById("nd-date").textContent = n.date;
    document.getElementById("nd-body").textContent = n.body || "";
    document.title = n.title + " | 루터대학교 국제교육원";
  }

  function show(items) {
    if (homeEl) { renderList(items, homeEl, 5); return; }
    var id = new URLSearchParams(location.search).get("id");
    var found = id && items.filter(function (n) { return String(n.id) === id; })[0];
    if (found) renderDetail(found); else renderList(items, listEl);
  }

  function init() {
    fetch("assets/data/notices.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(show)
      .catch(function () { show([]); });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
