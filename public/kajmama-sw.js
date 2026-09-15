/* KajMama BD Web Push — isolated from BloodLink. */
self.addEventListener("push", (event) => {
  let data = {
    title: "KajMama BD",
    body: "নতুন নোটিফিকেশন — ওয়েবসাইটে দেখুন",
    url: "/kajmama/dashboard",
    tag: "kajmama",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "KajMama BD", {
      body: data.body || "",
      icon: "/icon",
      badge: "/icon",
      tag: data.tag || "kajmama",
      data: { url: data.url || "/kajmama/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/kajmama/dashboard";
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
