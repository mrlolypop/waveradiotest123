/* WAVE player: one station, simple ordered fallback. No background probing. */
(function () {
  var C = window.WAVE_CONFIG;
  var audio = new Audio();
  audio.preload = "none";
  var idx = 0, wantPlay = false, stallTimer = null, tried = 0;
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  try { var v = localStorage.getItem("wave-vol"); if (v) audio.volume = +v; } catch (e) {}

  var lastS = "", lastMsg = "Ready";
  function setState(s, msg) {
    lastS = s; lastMsg = msg;
    document.querySelectorAll("[data-player-status]").forEach(function (el) {
      el.className = "status " + s;
      el.textContent = msg;
    });
    document.querySelectorAll("[data-player-toggle]").forEach(function (b) {
      var on = s === "playing" || s === "buffering";
      b.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
      b.classList.toggle("playing", s === "playing");
      b.setAttribute("aria-label", on ? "Pause WAVE Radio" : "Play WAVE Radio");
    });
  }
  function clearStall() { if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; } }
  function armStall() {
    clearStall();
    stallTimer = setTimeout(function () { if (wantPlay) next(); }, C.stallTimeoutMs);
  }
  function start(i) {
    idx = i;
    document.querySelectorAll("[data-player-source]").forEach(function (s) { s.value = String(idx); });
    audio.src = C.streams[idx].url + (C.streams[idx].url.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();
    setState("buffering", "Connecting…");
    armStall();
    var p = audio.play();
    if (p && p.catch) p.catch(function (e) {
      if (e && e.name === "NotAllowedError") { wantPlay = false; clearStall(); setState("", "Tap play"); }
    });
  }
  function next() {
    tried++;
    if (tried >= C.streams.length) {
      wantPlay = false; clearStall(); audio.removeAttribute("src"); audio.load();
      setState("error", "Stream unavailable — try again");
      return;
    }
    start((idx + 1) % C.streams.length);
  }
  function play() { wantPlay = true; tried = 0; start(idx); }
  function pause() {
    wantPlay = false; clearStall(); audio.pause();
    audio.removeAttribute("src"); audio.load(); // drop connection, rejoin live on next play
    setState("", "Paused");
  }

  audio.addEventListener("playing", function () { clearStall(); tried = 0; setState("playing", "Live"); });
  audio.addEventListener("waiting", function () { if (wantPlay) { setState("buffering", "Buffering…"); armStall(); } });
  audio.addEventListener("stalled", function () { if (wantPlay) armStall(); });
  audio.addEventListener("error", function () { if (wantPlay) { clearStall(); next(); } });

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-player-toggle]")) { wantPlay ? pause() : play(); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.matches("[data-player-volume]")) {
      audio.volume = +e.target.value;
      document.querySelectorAll("[data-player-volume]").forEach(function (r) { r.value = e.target.value; });
      try { localStorage.setItem("wave-vol", e.target.value); } catch (er) {}
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches("[data-player-source]")) {
      idx = +e.target.value;
      if (wantPlay) { tried = 0; start(idx); }
    }
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
  }

  function initControls() {
    document.querySelectorAll("[data-player-source]").forEach(function (s) {
      s.innerHTML = C.streams.map(function (st, i) { return '<option value="' + i + '">' + st.label + "</option>"; }).join("");
      s.value = String(idx);
    });
    document.querySelectorAll("[data-player-volume]").forEach(function (r) { r.value = audio.volume; });
  }
  // Soft navigation brought new page content: sync its controls with the running stream.
  document.addEventListener("wave:page", function () { initControls(); setState(lastS, lastMsg); });

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-player-source]").forEach(function (s) {
      s.innerHTML = C.streams.map(function (st, i) { return '<option value="' + i + '">' + st.label + "</option>"; }).join("");
    });
    document.querySelectorAll("[data-player-volume]").forEach(function (r) { r.value = audio.volume; });
    setState("", "Ready");
  });
})();
