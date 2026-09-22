const CACHE_NAME = 'tienda-ag-v19-compact-product-cards';
const APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './admin.js',
  './ux.js',
  './catalog.js',
  './v7.js',
  './enhancements.js',
  './platform.js',
  './manifest.json',
  './assets/icons/icon-192.png?v=20260921-2',
  './assets/icons/icon-512.svg?v=20260921-2',
  './assets/icons/apple-touch-icon.png?v=20260921-2',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  const trustedDependency=requestUrl.href==='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js'||requestUrl.href==='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  if (requestUrl.origin !== self.location.origin&&!trustedDependency) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
