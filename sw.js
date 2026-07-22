// =============================================
// OjolKIR - Service Worker (PWA Offline) v7
// =============================================

const CACHE = 'donefast-v7';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/app.css',
  './assets/js/app.js',
  './assets/js/dashboard.js',
  './assets/js/input.js',
  './assets/js/riwayat.js',
  './assets/js/analitik.js',
  './assets/icons/icon.svg',
  './assets/icons/icon.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/@phosphor-icons/web'
];

// Install: cache file statis
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first untuk HTML/manifest, Cache-first untuk aset statis
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first untuk HTML & Manifest agar update PWA fullscreen cepat masuk
  if (e.request.mode === 'navigate' || url.pathname.endsWith('manifest.json') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Statis & Gambar: cache-first dengan fallback network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
