/* Recently Played (from WAVE's own history feed) + contact form. */
(function () {
  var C = window.WAVE_CONFIG;
  var FALLBACK_ART = C.fallbackArt || "img/cover.png";
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function decode(s) { var t = document.createElement("textarea"); t.innerHTML = s || ""; return t.value; }
  // Blank artwork uses CONFIG.fallbackArt; broken links are caught by onerror below.
  function art(u) { return u ? u : FALLBACK_ART; }
  function ago(iso) {
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function load() {
    var list = document.querySelector("[data-history]");
    if (!list) return;
    var limit = parseInt(list.getAttribute("data-limit") || "10", 10);
    fetch(C.historyUrl, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) rows = rows.tracks || rows.history || [];
        rows = rows.slice(0, limit);
        if (!rows.length) { list.innerHTML = '<p class="empty">History will appear here as tracks play.</p>'; return; }
        list.innerHTML = rows.map(function (r) {
          var src = art(r.artwork_url);
          return '<li><img class="' + (src === FALLBACK_ART ? "fallback" : "") + '" src="' + esc(src) + '" alt="" loading="lazy" onerror="this.onerror=null;this.className=\'fallback\';this.src=\'' + FALLBACK_ART + '\'">' +
            '<div><div class="t">' + esc(decode(r.title)) + '</div><div class="a">' + esc(decode(r.artist)) + '</div></div>' +
            '<span class="mono">' + ago(r.played_at) + "</span></li>";
        }).join("");
      })
      .catch(function () { list.innerHTML = '<p class="empty">History is unavailable right now.</p>'; });
  }
  window.WAVE_art = art;
  document.addEventListener("DOMContentLoaded", load);
  document.addEventListener("wave:page", load);
  document.addEventListener("wave:track", function () { setTimeout(load, 5000); });
  setInterval(load, 60000);

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.matches("[data-contact-form]")) return;
    e.preventDefault();
    var msg = f.querySelector(".form-msg");
    if (f.website && f.website.value) return;
    if (!C.contactUrl) {
      var subject = encodeURIComponent("WAVE Radio — message from " + f.name.value);
      var body = encodeURIComponent(f.message.value + "\n\n— " + f.name.value + " (" + f.email.value + ")");
      window.location.href = "mailto:" + C.contactEmail + "?subject=" + subject + "&body=" + body;
      msg.className = "form-msg ok"; msg.textContent = "Opening your email app…";
      return;
    }
    msg.className = "form-msg"; msg.textContent = "Sending…";
    fetch(C.contactUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name.value, email: f.email.value, message: f.message.value }) })
      .then(function (r) { if (!r.ok) throw 0; f.reset(); msg.className = "form-msg ok"; msg.textContent = "Thanks — your message reached WAVE."; })
      .catch(function () { msg.className = "form-msg err"; msg.textContent = "Couldn't send. Please try again."; });
  });
})();
