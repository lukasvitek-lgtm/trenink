// Offline režim: síť napřed (aby se nová verze programu hned projevila), bez signálu z mezipaměti.
const C = 'trenink-v25';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-pwf-512.png', './icon-pwf-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function fetchTimeout(req, ms) {
  return new Promise((ok, ko) => {
    const t = setTimeout(() => ko(new Error('timeout')), ms);
    fetch(req).then(r => { clearTimeout(t); r.ok ? ok(r) : ko(new Error(r.status)); },
                    err => { clearTimeout(t); ko(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetchTimeout(req, 3000)
      .then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(req, cp)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(m => m || caches.match('./index.html')))
  );
});
