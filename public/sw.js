const CACHE = 'pay-demo-v2';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pay-demo-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if(event.request.mode === 'navigate') { event.respondWith(fetch(event.request).then(r => { if(r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('/', copy)); } return r; }).catch(() => caches.match('/'))); return; }
  if(url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/assets/') || /\.(png|woff2|webmanifest)$/.test(url.pathname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(r => { if(r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); } return r; })));
});
