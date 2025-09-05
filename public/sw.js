const CACHE_NAME = 'peso-coach-static-v1';
const ASSET_CACHE = 'peso-coach-assets-v1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(['/','/index.html','/manifest.webmanifest']);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => ![CACHE_NAME, ASSET_CACHE].includes(n)).map(n => caches.delete(n)));
  })());
});

// Network-first for index.html, cache-first for /assets/
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        return cached || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.open(ASSET_CACHE).then(cache => cache.match(event.request).then(resp => resp || fetch(event.request).then(net => { cache.put(event.request, net.clone()); return net; }))));
    return;
  }
});

