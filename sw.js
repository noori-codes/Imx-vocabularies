const CACHE_NAME = "imx-hub-v11";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/layout.css",
  "./styles/components.css",
  "./styles/quiz.css",
  "./styles/responsive.css",
  "./styles/print.css",
  "./app.js",
  "./IMX-logo.png",
  "./manifest.webmanifest",
  "./components/helpers.js",
  "./components/storage.js",
  "./components/dom.js",
  "./components/speech.js",
  "./components/share.js",
  "./components/cloze.js",
  "./data/categories.js",
  "./data/vocabulary.js",
  "./data/topics.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStyleOrScript =
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".webmanifest");

  // Always prefer fresh CSS/JS so style edits show up without fighting the cache.
  if (isStyleOrScript) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
