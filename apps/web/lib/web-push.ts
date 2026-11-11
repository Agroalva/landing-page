// Browser helpers for Web Push. The backend side lives in
// apps/app/convex/webPush.ts and convex/webPushSubscriptions.ts.

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";

const SERVICE_WORKER_URL = "/sw.js";

export function isWebPushSupported() {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

export function isWebPushConfigured() {
    return VAPID_PUBLIC_KEY.length > 0;
}

function urlBase64ToUint8Array(base64: string) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(normalized);
    const output = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) {
        output[index] = raw.charCodeAt(index);
    }
    return output;
}

export async function getServiceWorkerRegistration() {
    const existing = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
    return existing ?? navigator.serviceWorker.register(SERVICE_WORKER_URL);
}

export async function getCurrentPushSubscription() {
    if (!isWebPushSupported()) {
        return null;
    }
    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
    return registration ? registration.pushManager.getSubscription() : null;
}

export type SerializedPushSubscription = {
    endpoint: string;
    p256dh: string;
    auth: string;
};

export function serializeSubscription(subscription: PushSubscription): SerializedPushSubscription | null {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        return null;
    }
    return { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth };
}

// Asks for permission (if needed) and subscribes this browser.
export async function subscribeToPush() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        return { permission, subscription: null };
    }
    const registration = await getServiceWorkerRegistration();
    await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    return { permission, subscription };
}
