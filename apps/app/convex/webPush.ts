"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Web routes the browser opens when a notification is clicked. They differ
// from the mobile routes sent in Expo pushes (/chat/:id, /user-profile/:id).
function getWebUrl(type: string, relatedId: string | undefined) {
    if (!relatedId) {
        return "/notifications";
    }
    const id = encodeURIComponent(relatedId);
    switch (type) {
        case "message":
            return `/messages/${id}`;
        case "review":
            return `/profile/${id}`;
        case "favorite":
        case "saved_search":
        case "price_drop":
            return `/product/${id}`;
        default:
            return "/notifications";
    }
}

function getVapidConfig() {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:soporte@agroalva.com.ar";
    if (!publicKey || !privateKey) {
        return null;
    }
    return { publicKey, privateKey, subject };
}

// Sends a notification to every browser the user subscribed on the web.
// Never throws: missing VAPID config or push service errors are only logged,
// and subscriptions the push service reports as gone are removed.
export const send = internalAction({
    args: {
        userId: v.string(),
        title: v.string(),
        body: v.string(),
        type: v.string(),
        relatedId: v.optional(v.string()),
        notificationId: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const vapid = getVapidConfig();
        if (!vapid) {
            console.warn("Web push skipped: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set");
            return null;
        }

        const subscriptions = await ctx.runQuery(internal.webPushSubscriptions.listForUser, {
            userId: args.userId,
        });
        if (subscriptions.length === 0) {
            return null;
        }

        const payload = JSON.stringify({
            title: args.title,
            body: args.body,
            url: getWebUrl(args.type, args.relatedId),
            // Same tag replaces the previous notification for that conversation/listing.
            tag: args.relatedId ? `${args.type}:${args.relatedId}` : args.notificationId,
            notificationId: args.notificationId,
        });

        const gone: string[] = [];
        await Promise.all(
            subscriptions.map(async (subscription) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
                        },
                        payload,
                        {
                            vapidDetails: vapid,
                            TTL: 24 * 60 * 60,
                            urgency: args.type === "message" ? "high" : "normal",
                        }
                    );
                } catch (error) {
                    const statusCode = (error as { statusCode?: number }).statusCode;
                    if (statusCode === 404 || statusCode === 410) {
                        gone.push(subscription.endpoint);
                    } else {
                        console.error("Web push failed", statusCode, (error as Error).message);
                    }
                }
            })
        );

        if (gone.length > 0) {
            await ctx.runMutation(internal.webPushSubscriptions.removeByEndpoints, {
                endpoints: gone,
            });
        }
        return null;
    },
});
