/* Reads the existing WAVE metadata source and updates [data-wave] elements. */
(function () {
  var C = window.WAVE_CONFIG;
  var LOGO = C.fallbackArt || "img/cover.png";
  var lastTitle = null, lastArt = null, lastAlbum = "", lastP = null;
  var artCache = {};

  function decode(s) {
    var t = document.createElement("textarea");
    t.innerHTML = s || "";
    return t.value.replace(/[\u2060\u200B-\u200D\uFEFF]/g, "").trim();
  }
  function split(raw) {
    var i = raw.indexOf(" - ");
    if (i === -1) return { artist: "", title: raw };
    return { artist: raw.slice(0, i).trim(), title: raw.slice(i + 3).trim() };
  }
  function setAll(key, val) {
    document.querySelectorAll('[data-wave="' + key + '"]').forEach(function (el) { el.textContent = val; });
  }
  function setArt(url) {
    document.querySelectorAll('[data-wave="art"]').forEach(function (img) {
      img.onerror = function () { img.onerror = null; img.src = LOGO; img.classList.add("fallback"); };
      img.src = url || LOGO;
      img.classList.toggle("fallback", !url);
    });
  }
  function lookupArt(artist, title) {
    var key = artist + "|" + title;
    if (key in artCache) return Promise.resolve(artCache[key]);
    var q = encodeURIComponent((artist + " " + title).replace(/\(.*?\)|\[.*?\]/g, ""));
    return fetch("https://itunes.apple.com/search?entity=song&limit=1&term=" + q)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var r = j.results && j.results[0];
        var url = r && r.artworkUrl100 ? r.artworkUrl100.replace("100x100", "600x600") : null;
        artCache[key] = { url: url, album: r ? r.collectionName : "" };
        return artCache[key];
      })
      .catch(function () { return { url: null, album: "" }; });
  }
  window.WAVE_lookupArt = lookupArt;

  function norm(s) { return decode(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  // Use the exact cover WAVE's own server picked, so live + history always match.
  function currentArt(p, tries) {
    tries = tries || 0;
    if (!C.currentUrl) return lookupArt(p.artist, p.title);
    return fetch(C.currentUrl, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var same = norm((j.artist || "") + (j.title || "")) === norm(p.artist + p.title) ||
                   norm(j.title || "").indexOf(norm(p.title)) !== -1;
        if (!same) {
          if (tries < 3) return new Promise(function (ok) { setTimeout(ok, 4000); }).then(function () { return currentArt(p, tries + 1); });
          return lookupArt(p.artist, p.title);
        }
        var u = j.artwork_url;
        return { url: u || null, album: "" };
      })
      .catch(function () { return lookupArt(p.artist, p.title); });
  }

  function poll() {
    fetch(C.metadataUrl, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var src = j.icestats && j.icestats.source;
        if (Array.isArray(src)) src = src[0];
        if (!src) throw new Error("no source");
        var raw = decode(src.title);
        var p = split(raw);
        setAll("live", "ON AIR");
        document.querySelectorAll('[data-wave="live-dot"]').forEach(function (d) { d.className = "dot live"; });
        setAll("listeners", String(src.listeners != null ? src.listeners : "—"));
        setAll("bitrate", (src.bitrate || "—") + " kbps");
        setAll("genre", src.genre || "Electronic");
        if (raw !== lastTitle) {
          lastTitle = raw;
          setAll("title", p.title || "WAVE Radio");
          setAll("artist", p.artist || "PURE VELOCITY");
          lastP = p;
          currentArt(p).then(function (a) {
            lastArt = a.url; lastAlbum = a.album || "";
            setArt(a.url);
            setAll("album", a.album || "");
            if ("mediaSession" in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: p.title, artist: p.artist, album: "WAVE Radio",
                artwork: [{ src: new URL(a.url || LOGO, location.href).href, sizes: "1000x1000" }]
              });
            }
          });
          document.dispatchEvent(new CustomEvent("wave:track", { detail: p }));
        }
      })
      .catch(function () {
        setAll("live", "OFFLINE");
        document.querySelectorAll('[data-wave="live-dot"]').forEach(function (d) { d.className = "dot"; });
      });
  }
  // After soft navigation, refill the new page content with the current track.
  document.addEventListener("wave:page", function () {
    if (!lastP) return;
    setAll("title", lastP.title || "WAVE Radio");
    setAll("artist", lastP.artist || "PURE VELOCITY");
    setAll("album", lastAlbum);
    setArt(lastArt);
    poll();
  });
  poll();
  setInterval(poll, C.metadataPollMs);
})();
