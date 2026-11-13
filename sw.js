/* Offline app shell. Bump CACHE_VERSION whenever app files change. */
const CACHE_VERSION = 'nastasya-v3-offline';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.png',
  './assets/logo.jpg',
  './assets/fonts/eb-garamond-regular.ttf',
  './assets/fonts/eb-garamond-bold.ttf',
  './assets/fonts/noto-sans-regular.ttf',
  './assets/fonts/noto-sans-medium.ttf',
  './assets/fonts/noto-sans-bold.ttf'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('nastasya-') && key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Do not intercept external requests; all required app resources are local.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put('./index.html', response.clone());
        return response;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
