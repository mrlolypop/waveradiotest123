/* WAVE Radio configuration — the ONLY place endpoint URLs live. */
window.WAVE_CONFIG = {
  // Existing metadata source (Icecast JSON). Consumed as-is.
  metadataUrl: "https://data.waveradio.eu.org",
  metadataPollMs: 15000,

  // Existing distribution endpoints, in playback preference order.
  streams: [
    { id: "zeno1", label: "Server 1", url: "https://zeno1.waveradio.eu.org" },
    { id: "zeno2", label: "Server 2", url: "https://zeno2.waveradio.eu.org" },
    { id: "listen1", label: "Server 3", url: "https://listen1.waveradio.eu.org" },
    { id: "listen2", label: "Server 4", url: "https://listen2.waveradio.eu.org" }
  ],
  stallTimeoutMs: 10000,

  // WAVE's own now-playing feed (artist, title, chosen cover).
  currentUrl: "https://current.waveradio.eu.org",

  // WAVE's own recently played feed (newest first, covers included).
  historyUrl: "https://history.waveradio.eu.org",

  // Square cover shown when a song has no album art.
  fallbackArt: "img/cover.png",

  // Contact form endpoint. Leave "" to use a plain mailto link instead.
  contactUrl: "",
  contactEmail: "hello@waveradio.eu.org"
};
