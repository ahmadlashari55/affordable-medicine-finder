const CACHE = 'amf-static-v1';
const OFFLINE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js'
];
self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)));
});
self.addEventListener('fetch', ev => {
  ev.respondWith(caches.match(ev.request).then(r => r || fetch(ev.request)));
});
