// Agroalva service worker: shows Web Push notifications sent by the Convex
// backend (convex/webPush.ts) and opens the related page when clicked.

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = { body: event.data ? event.data.text() : "" };
    }

    const title = payload.title || "Agroalva";
    event.waitUntil(
        self.registration.showNotification(title, {
            body: payload.body || "",
            icon: "/favicon-512.png",
            badge: "/favicon-512.png",
            tag: payload.tag || undefined,
            renotify: Boolean(payload.tag),
            data: { url: payload.url || "/notifications" },
        }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const path = (event.notification.data && event.notification.data.url) || "/notifications";
    const target = new URL(path, self.location.origin);
    // Only open pages of this site.
    if (target.origin !== self.location.origin) {
        return;
    }

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (new URL(client.url).origin === target.origin && "focus" in client) {
                    return client.focus().then((focused) => (focused && "navigate" in focused ? focused.navigate(target.href) : undefined));
                }
            }
            return self.clients.openWindow(target.href);
        }),
    );
});
