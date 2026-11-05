// SDG Alati - offline cache za sve module.
// Kod svake nove verzije povećaj broj u CACHE; kod novog modula dodaj njegove datoteke u FILES.
const CACHE = 'sdg-alati-v1';
const FILES = [
  './', './index.html', './common.css', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './uplate/', './uplate/index.html', './uplate/parser.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// mreža prvo (da odmah vidiš nove verzije), cache kad nema interneta
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
