/* WAVE site: footer year + soft navigation so the player never stops between pages.
   Every page is still a complete standalone HTML file; this only swaps <main>. */
(function () {
  function year() { var y = document.getElementById("yr"); if (y) y.textContent = new Date().getFullYear(); }
  document.addEventListener("DOMContentLoaded", year);

  if (!window.fetch || !window.history || !history.pushState || location.protocol === "file:") return;

  function isInternal(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    if (a.origin !== location.origin) return false;
    var path = a.pathname;
    if (!/\.html$|\/$/.test(path)) return false;
    if (path === location.pathname && a.hash) return false;
    return true;
  }
  function setActive(path) {
    var file = path.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(function (l) {
      var f = (l.getAttribute("href") || "").split("/").pop();
      l.classList.toggle("active", f === file);
    });
  }
  function swapHead(doc) {
    document.title = doc.title;
    ["description", "og:title", "og:description", "og:url", "twitter:title", "twitter:description"].forEach(function (k) {
      var sel = 'meta[name="' + k + '"],meta[property="' + k + '"]';
      var n = doc.querySelector(sel), o = document.querySelector(sel);
      if (n && o) o.setAttribute("content", n.getAttribute("content"));
    });
    var nc = doc.querySelector('link[rel="canonical"]'), oc = document.querySelector('link[rel="canonical"]');
    if (nc && oc) oc.setAttribute("href", nc.getAttribute("href"));
  }
  function go(url, push) {
    return fetch(url, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var nm = doc.querySelector("main"), om = document.querySelector("main");
        if (!nm || !om) throw 0;
        om.replaceWith(document.importNode(nm, true));
        swapHead(doc);
        if (push) history.pushState({ wave: 1 }, "", url);
        setActive(new URL(url, location.href).pathname);
        var h = new URL(url, location.href).hash;
        var t = h && document.querySelector(h);
        if (t) t.scrollIntoView(); else window.scrollTo(0, 0);
        year();
        document.dispatchEvent(new CustomEvent("wave:page"));
      })
      .catch(function () { location.href = url; });
  }
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!isInternal(a)) return;
    e.preventDefault();
    if (a.href === location.href) return;
    go(a.href, true);
  });
  history.replaceState({ wave: 1 }, "", location.href);
  window.addEventListener("popstate", function () { go(location.href, false); });
})();
