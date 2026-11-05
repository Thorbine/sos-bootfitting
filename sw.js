// Netzwerk zuerst (Updates kommen sofort an), Cache als Offline-Rückfall.
const CACHE = 'bootfitting-shell';
const ASSETS = ['./', 'index.html', 'style.css', 'config.js', 'foot.js', 'store.js', 'pdf.js', 'app.js',
  'vendor/jspdf.umd.min.js', 'icons/logo.png', 'icons/icon-192.png', 'icons/icon-512.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
