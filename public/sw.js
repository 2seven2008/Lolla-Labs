const CACHE_NAME = "lolla-labs-v1";
const STATIC_ASSETS = [
  "/",
  "/enviar",
  "/login",
  "/agentes",
  "/css/style.css",
  "/js/app.js",
  "/js/api.js",
  "/js/auth.js",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
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
          const accept = request.headers.get("accept") || "";
          if (accept.includes("text/html")) {
            return new Response(
              `<!DOCTYPE html>
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
</html>`,
              { headers: { "Content-Type": "text/html" } },
            );
          }
        });
    }),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-looks") {
    event.waitUntil(syncPendingLooks());
  }
});

async function syncPendingLooks() {
  console.log("[SW] Syncing pending looks...");
}
