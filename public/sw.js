// Openchess service worker.
//
// What this does: keeps the app SHELL (HTML/JS/CSS/icons) available
// offline, so opening the app with no connection still renders the UI
// instead of a blank white screen or a browser error page.
//
// What this deliberately does NOT do: cache anything from /api/ or
// /socket.io/. This app's whole philosophy (see useAsyncData.js) is that
// a failed fetch shows a real error state with a retry button, never
// fake or stale data. Live game state, ratings, matchmaking — none of it
// is ever safe to serve from a cache. Offline mode here means "the app
// still opens and tells you honestly that it can't reach the server,"
// not "the app pretends to work."
//
// Bump CACHE_VERSION on any shell change that should force old caches
// out — there's no build-time plugin generating this for us.
const CACHE_VERSION = 'openchess-shell-v1';

const NEVER_CACHE_PATTERNS = [/^\/api\//, /^\/socket\.io\//];

function shouldBypass(url) {
  return NEVER_CACHE_PATTERNS.some((re) => re.test(url.pathname));
}

// Vite's built JS/CSS chunks are content-hashed (immutable — a given
// filename's contents never change), which makes them ideal for
// cache-first. Fonts/icons/manifest are effectively the same deal.
function isImmutableAsset(url) {
  return url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Only the entry points we can actually name ahead of time — real
      // JS/CSS bundle filenames are hashed per-build and get cached
      // opportunistically the first time they're fetched, below.
      cache.addAll(['/', '/index.html', '/manifest.webmanifest']).catch(() => {
        // A cold install with no network yet (e.g. first-ever load was
        // already offline) shouldn't hard-fail activation.
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Lets the client force an already-installed update to take over
// immediately (paired with the "update available" prompt in main.jsx)
// instead of waiting for every open tab to close.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept writes
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin (fonts CDN, etc.)
  if (shouldBypass(url)) return; // real API/socket traffic — network only, always

  if (request.mode === 'navigate') {
    // Network-first for page loads: an online user always gets the
    // freshest shell; an offline one gets whatever was last cached so
    // client-side routing still works instead of a dead browser error page.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Everything else same-origin (rare — favicon, etc.): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
