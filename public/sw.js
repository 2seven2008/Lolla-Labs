const CACHE_NAME = "lolla-labs-v1";
const STATIC_ASSETS = [
  "/",
  "/enviar",
  "/login",
  "./css/style.css",
  "./js/app.js",
  "./js/api.js",
  "./js/auth.js",
  "/public/manifest.json",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail for assets that can't be cached
      });
    }),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API requests (don't cache)
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Refresh cache in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Network fallback
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback HTML
          if (request.headers.get("accept").includes("text/html")) {
            return new Response(
              `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Lolla Labs — Offline</title>
              <style>
                body { background: #0a0a0a; color: #fff; font-family: serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                h1 { font-size: 3rem; color: #c8a96e; margin-bottom: 1rem; }
                p { color: #888; font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase; }
              </style>
            </head>
            <body>
              <div>
                <h1>L</h1>
                <p>Sem conexão — tente novamente</p>
              </div>
            </body>
            </html>
          `,
              { headers: { "Content-Type": "text/html" } },
            );
          }
        });
    }),
  );
});

// Background sync for pending submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-looks") {
    event.waitUntil(syncPendingLooks());
  }
});

async function syncPendingLooks() {
  // In a full implementation, read from IndexedDB and retry failed submissions
  console.log("[SW] Syncing pending looks...");
}
