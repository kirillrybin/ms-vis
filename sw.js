// Offline support: the page and the Three.js files from the CDN are kept in a cache.
// The page is fetched from the network first (so updates arrive), with a fast fallback to the cache.
const CACHE = 'ms-vis-v1';
const CDN = 'https://cdn.jsdelivr.net/npm/three@';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function cacheFirst(req) {                  // the CDN files are versioned, so a cached copy never goes stale
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) c.put(req, res.clone());
  return res;
}
async function networkFirst(req) {                // a slow or missing network falls back to the cache after 3 s
  const c = await caches.open(CACHE);
  const cached = () => c.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? c.match('./index.html') : undefined));
  const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
  const timeout = new Promise(res => setTimeout(() => res(null), 3000));
  try {
    const first = await Promise.race([net, timeout]);
    if (first) return first;
    return (await cached()) || net;
  } catch (_) {
    return (await cached()) || Response.error();
  }
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.startsWith(CDN)) e.respondWith(cacheFirst(req));
  else if (new URL(req.url).origin === self.location.origin) e.respondWith(networkFirst(req));
});
// the page lists the CDN files it loaded, so that everything is cached after the very first visit
self.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.type !== 'warm' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    let ok = 0;
    for (const u of d.urls) {
      if (typeof u !== 'string' || !u.startsWith(CDN)) continue;
      try {
        if (!(await c.match(u))) { const r = await fetch(u, { mode: 'cors' }); if (r.ok) await c.put(u, r); else continue; }
        ok++;
      } catch (_) {}
    }
    const all = await self.clients.matchAll();
    all.forEach(cl => cl.postMessage({ type: 'warmed', count: ok }));
  })());
});
