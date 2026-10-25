// Service worker da Murel: torna o app instalável e mostra uma página amigável sem conexão.
// Não faz cache de páginas nem de chamadas à API, pois contêm dados operacionais e financeiros.
const OFFLINE_URL = "/offline.html";
// O nome muda a cada versão da página offline: o ativador apaga os caches com outro nome.
const CACHE_NAME = "murel-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
