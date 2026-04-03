const CACHE_NAME = 'desligest-v2.2';
const ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.json'
];

// Otimização para forçar a atualização (Network First para HTML)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Quando houver nova versão, instala imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia: Network First (Tenta a rede, cai no cache se offline)
  // Isso garante que o usuário sempre veja a versão mais nova ao dar F5 online.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
