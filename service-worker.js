const CACHE_NAME = "dialogue-translator-shell-v39";
const APP_SHELL = [
  "./",
  "./index.html?v=39",
  "./styles.css?v=39",
  "./app-config.js?v=39",
  "./app-utils.js?v=39",
  "./language-detector.js?v=39",
  "./app.js?v=39",
  "./manifest.webmanifest",
  "./icon.svg",
  "./pixel_penguin_export.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html?v=39", copy));
          return response;
        })
        .catch(async () => {
          return (await caches.match("./index.html?v=39"))
            || (await caches.match("./"))
            || Response.error();
        })
    );
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => {
        return (await caches.match(request))
          || (await caches.match(url.pathname))
          || Response.error();
      })
  );
});
