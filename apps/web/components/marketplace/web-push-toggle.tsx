"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BellOff, BellRing } from "lucide-react";
import { api } from "@/lib/convex-api";
import {
    getCurrentPushSubscription,
    isWebPushConfigured,
    isWebPushSupported,
    serializeSubscription,
    subscribeToPush,
} from "@/lib/web-push";
import { Button } from "@/components/ui/button";

type BrowserState = "checking" | "unsupported" | "denied" | "ready";

// Lets the user turn browser notifications on/off for this browser.
export function WebPushToggle() {
    const [browserState, setBrowserState] = useState<BrowserState>("checking");
    const [endpoint, setEndpoint] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const register = useMutation(api.webPushSubscriptions.register);
    const unregister = useMutation(api.webPushSubscriptions.unregister);
    const setPushEnabled = useMutation(api.notifications.setPushNotificationsEnabled);
    const profile = useQuery(api.users.getMe, {});
    const isRegistered = useQuery(api.webPushSubscriptions.isRegistered, endpoint ? { endpoint } : "skip");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isWebPushSupported() || !isWebPushConfigured()) {
                if (!cancelled) setBrowserState("unsupported");
                return;
            }
            if (Notification.permission === "denied") {
                if (!cancelled) setBrowserState("denied");
                return;
            }
            const subscription = await getCurrentPushSubscription().catch(() => null);
            if (!cancelled) {
                setEndpoint(subscription?.endpoint ?? null);
                setBrowserState("ready");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (browserState === "checking") {
        return null;
    }

    const pushDisabledInAccount = profile?.pushNotificationsEnabled === false;
    const isOn = Boolean(endpoint) && isRegistered === true && !pushDisabledInAccount;

    const enable = async () => {
        setBusy(true);
        setError(null);
        try {
            const { permission, subscription } = await subscribeToPush();
            if (permission === "denied") {
                setBrowserState("denied");
                return;
            }
            const serialized = subscription ? serializeSubscription(subscription) : null;
            if (!serialized) {
                setError("No pudimos activar las notificaciones en este navegador.");
                return;
            }
            await register({ ...serialized, userAgent: navigator.userAgent });
            if (pushDisabledInAccount) {
                await setPushEnabled({ enabled: true });
            }
            setEndpoint(serialized.endpoint);
        } catch (cause) {
            console.error("Web push subscribe failed", cause);
            setError("No pudimos activar las notificaciones en este navegador.");
        } finally {
            setBusy(false);
        }
    };

    const disable = async () => {
        setBusy(true);
        setError(null);
        try {
            const subscription = await getCurrentPushSubscription();
            if (subscription) {
                await unregister({ endpoint: subscription.endpoint });
                await subscription.unsubscribe();
            }
            setEndpoint(null);
        } catch (cause) {
            console.error("Web push unsubscribe failed", cause);
            setError("No pudimos desactivar las notificaciones.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mb-6 flex flex-col gap-4 rounded-[1.6rem] border bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                {isOn ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
                <h2 className="font-black">Notificaciones en este navegador</h2>
                <p className="mt-1 text-sm text-stone-600">
                    {browserState === "unsupported"
                        ? "Este navegador no admite notificaciones. En iPhone, agregá Agroalva a la pantalla de inicio para recibirlas."
                        : browserState === "denied"
                            ? "Bloqueaste las notificaciones de Agroalva. Habilitalas desde la configuración del sitio en tu navegador."
                            : isOn
                                ? "Te avisamos de mensajes nuevos, búsquedas guardadas y bajas de precio aunque no tengas Agroalva abierto."
                                : "Activalas para enterarte de mensajes nuevos, búsquedas guardadas y bajas de precio aunque no tengas Agroalva abierto."}
                </p>
                {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
            </div>
            {browserState === "ready" && (
                <Button
                    type="button"
                    variant={isOn ? "outline" : "default"}
                    disabled={busy || (Boolean(endpoint) && isRegistered === undefined)}
                    onClick={() => void (isOn ? disable() : enable())}
                    className={`rounded-full px-6 ${isOn ? "" : "bg-emerald-800"}`}
                >
                    {busy ? "Un momento..." : isOn ? "Desactivar" : "Activar"}
                </Button>
            )}
        </div>
    );
}
