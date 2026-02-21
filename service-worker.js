/* Simple PWA service worker (cache-first for assets, network-first for navigation) */
    // Bump cache version when the generated site structure changes.
    const CACHE_VERSION = "2026-02-21T10:07:21";
    const CACHE_NAME = "ping-stats-" + CACHE_VERSION;

    const CORE = [
      "./",
      "./index.html",
      "./site_data.json",
      "./data/manifest.json",
      "./data/club.json",
      "./manifest.webmanifest",
      "./service-worker.js",
      "./assets/graphs_bundle.js",
      "./assets/icons/icon-192.png",
      "./assets/icons/icon-512.png",
      "./assets/icons/icon-180.png"
    ];

    self.addEventListener("install", (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(CORE))
          .then(() => self.skipWaiting())
      );
    });

    self.addEventListener("activate", (event) => {
      event.waitUntil(
        caches.keys()
          .then((keys) => Promise.all(
            keys.filter((k) => k.startsWith("ping-stats-") && k !== CACHE_NAME).map((k) => caches.delete(k))
          ))
          .then(() => self.clients.claim())
      );
    });

    self.addEventListener("fetch", (event) => {
      const req = event.request;
      if (req.method !== "GET") return;

      const url = new URL(req.url);
      if (url.origin !== self.location.origin) return;

      // Navigations: network-first, fallback cache index.html
      if (req.mode === "navigate") {
        event.respondWith(
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
              return res;
            })
            .catch(() => caches.match("./index.html"))
        );
        return;
      }

      // Assets: stale-while-revalidate
      event.respondWith(
        caches.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            return res;
          }).catch(() => null);

          if (cached) {
            event.waitUntil(fetchPromise);
            return cached;
          }
          return fetchPromise.then((res) => res || cached);
        })
      );
    });
    