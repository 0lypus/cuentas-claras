const CACHE = "cuentas-claras-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // La API (y cualquier otro origen) no se cachea: los datos tienen que estar frescos
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Navegación: red primero y, si no hay conexión, el index cacheado
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copia = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/index.html", copia));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Estáticos: cache primero, actualizando en segundo plano
  event.respondWith(
    caches.match(request).then((cached) => {
      const red = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copia = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
          }
          return response;
        })
        .catch(() => cached);

      return cached || red;
    }),
  );
});
