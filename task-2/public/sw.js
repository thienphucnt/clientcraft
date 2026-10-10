// ClientCraft High-Performance Service Worker - 100% Offline PWA Resilience
const CACHE_NAME = "clientcraft-pwa-v2";

const PRECACHE_ASSETS = [
  "/",
  "/tools/image-compressor",
  "/tools/json-to-typescript",
  "/tools/text-privacy-scrubber",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Precache core routes and shell assets on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up stale caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Cache strategies: Cache-First for static bundles & fonts; Network-First with Cache Fallback for pages
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Static hashed assets (JS chunks, CSS, web fonts, SVGs, images) -> Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Navigation requests (HTML pages) -> Network-First with Stale/Cache Fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Check if specific route is cached
          const matched = await caches.match(event.request);
          if (matched) return matched;

          // Check if root or tool landing page fallback exists
          const home = await caches.match("/");
          return home || new Response("Offline - Page available in offline cache", { status: 200, headers: { "Content-Type": "text/html" } });
        })
    );
    return;
  }

  // 3. All other requests -> Cache with Network Fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          return new Response("Offline", { status: 503 });
        })
      );
    })
  );
});
