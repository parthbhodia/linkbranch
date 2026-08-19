// Cueful service worker.
//
// Scope is deliberately narrow. The point of installing this app is to have
// your code on screen at an event, where venue wifi is usually the worst
// network you will meet all week -- so the build assets are cached to make the
// app boot without a round trip.
//
// What is NOT cached: any HTML document. Every page that matters here is
// behind auth and rendered per user (/card is force-dynamic), and a cached
// authenticated document would be served to whoever opens the app next on a
// shared or handed-over phone. Documents always go to the network; if the
// network is gone, the offline page explains why rather than showing someone
// else's card.

const VERSION = "v1";
const STATIC_CACHE = `cueful-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

// Icons and the offline page are all that is worth pre-seeding. Build assets
// are hashed, so they are picked up on first use instead.
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("cueful-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(url) {
  // Hashed build output and the icons. Everything here is immutable and
  // contains nothing user-specific.
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-icon.png"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Documents: network only, with an offline explainer. Never cached -- see
  // the note at the top.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Opaque and error responses are not worth persisting.
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const copy = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
