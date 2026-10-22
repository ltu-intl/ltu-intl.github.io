/* Notice admin: edits assets/data/notices.json in the GitHub repo through the Contents API. */
(function () {
  "use strict";

  var REPO = "ltu-intl/ltu-intl.github.io";
  var PATH = "assets/data/notices.json";
  var BRANCH = "main";
  var API = "https://api.github.com/repos/" + REPO + "/contents/" + PATH;

  var $ = function (id) { return document.getElementById(id); };
  var token = "";
  var notices = [];
  var sha = null;
  var editingId = null;

  try { token = sessionStorage.getItem("ltu_admin_token") || ""; } catch (e) { /* ignore */ }

  function headers() {
    return { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" };
  }
  function enc(s) { return btoa(unescape(encodeURIComponent(s))); }
  function dec(s) { return decodeURIComponent(escape(atob(s.replace(/\n/g, "")))); }
  function say(el, text, ok) { el.textContent = text; el.className = "msg " + (ok ? "ok" : "err"); }
  function today() { return new Date().toISOString().slice(0, 10); }

  function load() {
    return fetch(API + "?ref=" + BRANCH + "&t=" + Date.now(), { headers: headers(), cache: "no-store" })
      .then(function (r) {
        if (r.status === 401 || r.status === 403 || r.status === 404) throw new Error("토큰이 올바르지 않거나 권한이 없습니다.");
        if (!r.ok) throw new Error("불러오기 실패 (" + r.status + ")");
        return r.json();
      })
      .then(function (f) { sha = f.sha; notices = JSON.parse(dec(f.content)); });
  }

  function commit(message) {
    var body = { message: message, content: enc(JSON.stringify(notices, null, 2) + "\n"), sha: sha, branch: BRANCH };
    return fetch(API, { method: "PUT", headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (r.status === 409 || r.status === 422) throw new Error("다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 시도하세요.");
        if (!r.ok) throw new Error("저장 실패 (" + r.status + ")");
        return r.json();
      })
      .then(function (res) { sha = res.content.sha; });
  }

  function sortedNotices() {
    return notices.slice().sort(function (a, b) {
      return (b.date || "").localeCompare(a.date || "") || b.id - a.id;
    });
  }

  function renderItems() {
    var box = $("items");
    box.textContent = "";
    if (!notices.length) { box.textContent = "등록된 공지가 없습니다."; return; }
    sortedNotices().forEach(function (n) {
      var row = document.createElement("div");
      row.className = "adm-item";
      var t = document.createElement("div");
      t.className = "t";
      t.textContent = (n.pinned ? "📌 " : "") + n.title;
      var s = document.createElement("small");
      s.textContent = n.date;
      t.appendChild(s);
      var e = document.createElement("button");
      e.className = "btn btn-navy btn-sm"; e.type = "button"; e.textContent = "수정";
      e.onclick = function () { startEdit(n.id); };
      var d = document.createElement("button");
      d.className = "btn btn-sm danger"; d.type = "button"; d.textContent = "삭제";
      d.onclick = function () { remove(n.id); };
      row.appendChild(t); row.appendChild(e); row.appendChild(d);
      box.appendChild(row);
    });
  }

  function resetForm() {
    editingId = null;
    $("form-title").textContent = "새 공지 작성";
    $("f-title").value = ""; $("f-body").value = ""; $("f-pinned").checked = false;
    $("f-date").value = today();
    $("btn-cancel").hidden = true;
  }

  function startEdit(id) {
    var n = notices.filter(function (x) { return x.id === id; })[0];
    if (!n) return;
    editingId = id;
    $("form-title").textContent = "공지 수정";
    $("f-title").value = n.title; $("f-body").value = n.body || "";
    $("f-date").value = n.date; $("f-pinned").checked = !!n.pinned;
    $("btn-cancel").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reloadAfterError(err) {
    say($("msg"), err.message, false);
    return load().then(renderItems).catch(function () { /* keep message */ });
  }

  function save() {
    var title = $("f-title").value.trim();
    if (!title) { say($("msg"), "제목을 입력하세요.", false); return; }
    var data = { title: title, date: $("f-date").value || today(), body: $("f-body").value, pinned: $("f-pinned").checked };
    var msg;
    if (editingId !== null) {
      notices = notices.map(function (n) { return n.id === editingId ? Object.assign({ id: n.id }, data) : n; });
      msg = "공지 수정: " + title;
    } else {
      var nextId = notices.reduce(function (m, n) { return Math.max(m, n.id); }, 0) + 1;
      notices.push(Object.assign({ id: nextId }, data));
      msg = "공지 등록: " + title;
    }
    $("btn-save").disabled = true;
    say($("msg"), "저장 중...", true);
    commit(msg).then(function () {
      say($("msg"), "저장되었습니다. 사이트 반영까지 1~2분 걸립니다.", true);
      resetForm(); renderItems();
    }).catch(reloadAfterError).then(function () { $("btn-save").disabled = false; });
  }

  function remove(id) {
    var n = notices.filter(function (x) { return x.id === id; })[0];
    if (!n || !confirm("'" + n.title + "' 공지를 삭제할까요?")) return;
    notices = notices.filter(function (x) { return x.id !== id; });
    commit("공지 삭제: " + n.title).then(function () {
      say($("msg"), "삭제되었습니다. 사이트 반영까지 1~2분 걸립니다.", true);
      renderItems();
    }).catch(reloadAfterError);
  }

  function enter() {
    $("login").hidden = true; $("panel").hidden = false;
    resetForm(); renderItems();
  }

  function login() {
    token = $("token").value.trim();
    if (!token) { say($("login-msg"), "토큰을 입력하세요.", false); return; }
    say($("login-msg"), "확인 중...", true);
    load().then(function () {
      try { sessionStorage.setItem("ltu_admin_token", token); } catch (e) { /* ignore */ }
      $("token").value = "";
      enter();
    }).catch(function (err) { token = ""; say($("login-msg"), err.message, false); });
  }

  function logout() {
    try { sessionStorage.removeItem("ltu_admin_token"); } catch (e) { /* ignore */ }
    token = ""; location.reload();
  }

  $("btn-login").onclick = login;
  $("btn-save").onclick = save;
  $("btn-cancel").onclick = resetForm;
  $("btn-logout").onclick = logout;
  $("token").addEventListener("keydown", function (e) { if (e.key === "Enter") login(); });

  if (token) { load().then(enter).catch(function () { token = ""; }); }
})();
