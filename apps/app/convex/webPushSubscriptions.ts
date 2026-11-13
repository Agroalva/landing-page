import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { authComponent } from "./auth";

// Browsers can stay subscribed for a long time; keep the most recent ones.
const MAX_WEB_PUSH_SUBSCRIPTIONS_PER_USER = 10;
const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;

const isValidEndpoint = (endpoint: string) => {
    if (endpoint.length > MAX_ENDPOINT_LENGTH) {
        return false;
    }
    try {
        return new URL(endpoint).protocol === "https:";
    } catch {
        return false;
    }
};

// Used by notifications.ts to decide whether a user can receive any push at all.
export async function hasWebPushSubscriptions(ctx: MutationCtx, userId: string) {
    const subscription = await ctx.db
        .query("webPushSubscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
    return subscription !== null;
}

// Save (or refresh) this browser's push subscription for the current user.
export const register = mutation({
    args: {
        endpoint: v.string(),
        p256dh: v.string(),
        auth: v.string(),
        userAgent: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }
        const userId = user._id as string;
        const endpoint = args.endpoint.trim();
        if (
            !isValidEndpoint(endpoint) ||
            !args.p256dh ||
            !args.auth ||
            args.p256dh.length > MAX_KEY_LENGTH ||
            args.auth.length > MAX_KEY_LENGTH
        ) {
            throw new Error("Suscripción de notificaciones inválida");
        }
        const userAgent = args.userAgent?.slice(0, 300);
        const now = Date.now();

        // A browser belongs to the account signed in on it: detach it from other users.
        const existing = await ctx.db
            .query("webPushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
            .collect();
        let own = null;
        for (const subscription of existing) {
            if (subscription.userId === userId && !own) {
                own = subscription;
            } else {
                await ctx.db.delete(subscription._id);
            }
        }

        if (own) {
            await ctx.db.patch(own._id, {
                p256dh: args.p256dh,
                auth: args.auth,
                userAgent,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("webPushSubscriptions", {
                userId,
                endpoint,
                p256dh: args.p256dh,
                auth: args.auth,
                userAgent,
                createdAt: now,
                updatedAt: now,
            });
        }

        const subscriptions = await ctx.db
            .query("webPushSubscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        if (subscriptions.length > MAX_WEB_PUSH_SUBSCRIPTIONS_PER_USER) {
            const stale = subscriptions
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(MAX_WEB_PUSH_SUBSCRIPTIONS_PER_USER);
            for (const subscription of stale) {
                await ctx.db.delete(subscription._id);
            }
        }

        return null;
    },
});

// Remove this browser's subscription (when the user turns it off or signs out).
export const unregister = mutation({
    args: {
        endpoint: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) {
            return null;
        }
        const subscriptions = await ctx.db
            .query("webPushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint.trim()))
            .collect();
        for (const subscription of subscriptions) {
            if (subscription.userId === (user._id as string)) {
                await ctx.db.delete(subscription._id);
            }
        }
        return null;
    },
});

// Whether this browser's endpoint is registered for the current user.
export const isRegistered = query({
    args: {
        endpoint: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) {
            return false;
        }
        const subscriptions = await ctx.db
            .query("webPushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint.trim()))
            .collect();
        return subscriptions.some((subscription) => subscription.userId === (user._id as string));
    },
});

export const listForUser = internalQuery({
    args: {
        userId: v.string(),
    },
    returns: v.array(
        v.object({
            endpoint: v.string(),
            p256dh: v.string(),
            auth: v.string(),
        })
    ),
    handler: async (ctx, args) => {
        const subscriptions = await ctx.db
            .query("webPushSubscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .take(MAX_WEB_PUSH_SUBSCRIPTIONS_PER_USER * 2);
        return subscriptions.map(({ endpoint, p256dh, auth }) => ({ endpoint, p256dh, auth }));
    },
});

// Called by the sender when the push service says the subscription is gone (404/410).
export const removeByEndpoints = internalMutation({
    args: {
        endpoints: v.array(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const endpoint of new Set(args.endpoints)) {
            const subscriptions = await ctx.db
                .query("webPushSubscriptions")
                .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
                .collect();
            for (const subscription of subscriptions) {
                await ctx.db.delete(subscription._id);
            }
        }
        return null;
    },
});
