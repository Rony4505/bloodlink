/* BloodLink BD — PWA + Web Push service worker (Play Store / TWA ready). */
const CACHE = "bloodlink-shell-v2";
const PRECACHE = ["/", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Network-first for navigations; keeps app usable offline for the shell. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match("/") || caches.match(req)),
    );
    return;
  }

  if (PRECACHE.some((p) => url.pathname === p)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req)),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "BloodLink BD",
    body: "নতুন নোটিফিকেশন — অ্যাপে দেখুন",
    url: "/admin",
    tag: "bloodlink",
  };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    /* keep defaults */
  }

  const title = data.title || "BloodLink BD";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || `bloodlink-${Date.now()}`,
    data: { url: data.url || "/admin" },
    requireInteraction: true,
    renotify: true,
    silent: false,
    vibrate: [160, 80, 160, 80, 160],
    timestamp: Date.now(),
  };

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(title, options);
      } catch (err) {
        console.error("[bloodlink-sw] showNotification failed", err);
      }
      try {
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({
            type: "bloodlink-push",
            title,
            body: options.body,
            url: options.data.url,
          });
        }
      } catch {
        /* ignore */
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return undefined;
      }),
  );
});
