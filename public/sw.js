/* BloodLink Web Push service worker — shows notifications even when the site tab is closed. */
self.addEventListener("push", (event) => {
  let data = {
    title: "BloodLink",
    body: "নতুন নোটিফিকেশন — ওয়েবসাইটে দেখুন",
    url: "/notifications",
    tag: "bloodlink",
  };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "BloodLink", {
      body: data.body || "",
      icon: "/icon",
      badge: "/icon",
      tag: data.tag || "bloodlink",
      data: { url: data.url || "/notifications" },
      requireInteraction: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
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
