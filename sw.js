// Service worker: sempre tenta a rede primeiro para o código do app (você vê a versão nova), cai para o
// cache se estiver sem internet. Mapa e fontes: usa o cache e atualiza em segundo plano.
const VERSAO = "fx-v10";
const TILES = "fx-tiles";
const MAX_TILES = 400;
const SHELL = ["./", "index.html", "css/style.css", "js/app.js", "js/search.js", "js/data.js", "js/icons.js", "js/agora.js", "js/config.js", "js/cartao.js", "js/fotos.js", "js/condicoes.js", "js/passaporte.js",
  "vendor/leaflet.js", "vendor/leaflet.css", "css/fonts.css", "vendor/fonts/youngserif.woff2", "vendor/fonts/atkinson-400.woff2", "vendor/fonts/atkinson-700.woff2", "vendor/fonts/caveat.woff2", "manifest.webmanifest", "icons/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function limitar(cache) {
  const ks = await cache.keys();
  if (ks.length > MAX_TILES) await Promise.all(ks.slice(0, ks.length - MAX_TILES).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/routing\.openstreetmap\.de|overpass|open-meteo/.test(url.hostname)) return; // dados ao vivo: sempre rede

  if (url.origin === location.origin) { // rede primeiro, cache como reserva
    e.respondWith(
      fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(VERSAO).then((ca) => ca.put(req, c)); } return r; })
        .catch(() => caches.match(req).then((r) => r ?? caches.match("index.html")))
    );
    return;
  }
  const cacheNome = /tile\.openstreetmap\.org/.test(url.hostname) ? TILES : VERSAO;
  e.respondWith(
    caches.open(cacheNome).then(async (cache) => {
      const emCache = await cache.match(req);
      const rede = fetch(req).then((r) => { if (r.ok || r.type === "opaque") { cache.put(req, r.clone()).then(() => cacheNome === TILES && limitar(cache)); } return r; }).catch(() => emCache);
      return emCache ?? rede;
    })
  );
});
