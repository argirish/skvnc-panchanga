// =====================================================
// Panchanga 2026 — Service Worker
// Bump CACHE_VERSION whenever you deploy an update.
// The old cache will be deleted and fresh content served.
// =====================================================

const CACHE_VERSION = ‘panchanga-v1’;
const ASSETS = [
‘/index.html’,
‘/manifest.json’,
‘https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap’
];

// –– Install: cache all assets ––
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
);
// Activate immediately without waiting for old SW to finish
self.skipWaiting();
});

// –– Activate: delete old caches ––
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys
.filter(key => key !== CACHE_VERSION)
.map(key => caches.delete(key))
)
)
);
// Take control of all open clients immediately
self.clients.claim();
});

// –– Fetch: network-first for HTML, cache-first for assets ––
self.addEventListener(‘fetch’, event => {
const url = new URL(event.request.url);

// Always go network-first for the main HTML page
// so updates are picked up on next open
if (url.pathname === ‘/’ || url.pathname.endsWith(‘index.html’)) {
event.respondWith(
fetch(event.request)
.then(response => {
// Update cache with fresh copy
const clone = response.clone();
caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
return response;
})
.catch(() => caches.match(’/index.html’))
);
return;
}

// Cache-first for everything else (fonts, icons)
event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;
return fetch(event.request).then(response => {
const clone = response.clone();
caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
return response;
});
})
);
});

// –– Listen for SKIP_WAITING message from the page ––
self.addEventListener(‘message’, event => {
if (event.data === ‘SKIP_WAITING’) self.skipWaiting();
});
