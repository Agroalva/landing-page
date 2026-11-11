import {
    query,
    mutation,
    internalMutation,
    internalAction,
    type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { presence } from "./presence";

const notificationTypeValidator = v.union(
    v.literal("message"),
    v.literal("favorite"),
    v.literal("comment"),
    v.literal("like"),
    v.literal("review"),
    v.literal("saved_search"),
    v.literal("price_drop")
);

type NotificationType = Doc<"notifications">["type"];

// ============================================================================
// Push notification settings
// ============================================================================

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const EXPO_PUSH_TOKEN_REGEX = /^Expo(nent)?PushToken\[[^\]]+\]$/;
const ANDROID_CHANNEL_ID = "default";

// Max devices kept per user (oldest are pruned).
const MAX_PUSH_DEVICES_PER_USER = 10;
// Chat throttle: at most one push per conversation in this window while the
// recipient hasn't caught up; extra messages are grouped into one digest push.
const CHAT_PUSH_WINDOW_MS = 2 * 60 * 1000;
// How far back we look for unread messages when deciding/grouping.
const CHAT_UNREAD_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const CHAT_UNREAD_SCAN_LIMIT = 50;
// Expo recommends checking receipts ~15 minutes after sending.
const RECEIPT_CHECK_DELAY_MS = 15 * 60 * 1000;
const MAX_SEND_ATTEMPTS = 3;

const pushDataValidator = v.object({
    type: notificationTypeValidator,
    relatedId: v.optional(v.string()),
    notificationId: v.optional(v.string()),
    url: v.optional(v.string()),
});

const pushPlatformValidator = v.union(
    v.literal("ios"),
    v.literal("android"),
    v.literal("web")
);

function isExpoPushToken(token: string): boolean {
    return token.length <= 256 && EXPO_PUSH_TOKEN_REGEX.test(token);
}

function truncate(text: string, max: number): string {
    const clean = text.trim();
    return clean.length > max ? `${clean.substring(0, max)}...` : clean;
}

// In-app route the client should open when the push is tapped.
function getNotificationUrl(
    type: NotificationType,
    relatedId: string | undefined
): string | undefined {
    if (!relatedId) {
        return undefined;
    }
    const id = encodeURIComponent(relatedId);
    switch (type) {
        case "message":
            return `/chat/${id}`;
        case "favorite":
            return `/product/${id}`;
        case "review":
            return `/user-profile/${id}`;
        case "saved_search":
        case "price_drop":
            return `/product/${id}`;
        default:
            return undefined;
    }
}

async function getProfile(ctx: MutationCtx, userId: string) {
    return await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
}

async function getDisplayName(ctx: MutationCtx, userId: string | undefined) {
    if (!userId) {
        return undefined;
    }
    const profile = await getProfile(ctx, userId);
    return profile?.displayName || undefined;
}

// All push tokens for a user: registered devices + legacy `profiles.pushToken`.
async function getPushTokens(
    ctx: MutationCtx,
    userId: string,
    profile: Doc<"profiles"> | null
): Promise<string[]> {
    const devices = await ctx.db
        .query("pushDevices")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(MAX_PUSH_DEVICES_PER_USER * 2);
    const tokens = new Set<string>();
    for (const device of devices) {
        tokens.add(device.token);
    }
    if (profile?.pushToken) {
        tokens.add(profile.pushToken);
    }
    return [...tokens].filter(isExpoPushToken);
}

// Returns the recipient's tokens, or [] if they disabled push / have no devices.
async function getDeliverableTokens(ctx: MutationCtx, userId: string) {
    const profile = await getProfile(ctx, userId);
    if (profile?.pushNotificationsEnabled === false) {
        return [];
    }
    return await getPushTokens(ctx, userId, profile);
}

// True if the user currently has the conversation open (chat screen sends
// presence heartbeats; older app versions don't, so they count as "not viewing").
async function isViewingConversation(
    ctx: MutationCtx,
    userId: string,
    conversationId: Id<"conversations">
): Promise<boolean> {
    try {
        const online = await presence.listRoom(ctx, conversationId, true, 20);
        return online.some((entry) => entry.userId === userId && entry.online);
    } catch (error) {
        console.error("Error checking presence for push:", error);
        return false;
    }
}

// Unread messages sent by others to `userId` in a conversation since `since`.
async function getUnreadMessagesSince(
    ctx: MutationCtx,
    conversationId: Id<"conversations">,
    userId: string,
    since: number
) {
    const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId_createdAt", (q) =>
            q.eq("conversationId", conversationId).gt("createdAt", since)
        )
        .order("desc")
        .take(CHAT_UNREAD_SCAN_LIMIT);
    return messages.filter(
        (message) =>
            message.senderId !== userId &&
            !(message.readBy || []).includes(userId)
    );
}

function describeMessage(message: Doc<"messages">): string {
    const text = message.text.trim();
    if (text) {
        return truncate(text, 100);
    }
    return message.mediaId ? "Te envió una imagen" : "Te envió un mensaje";
}

type PushContent = {
    title: string;
    body: string;
    data: {
        type: NotificationType;
        relatedId?: string;
        notificationId?: string;
        url?: string;
    };
};

async function schedulePush(
    ctx: MutationCtx,
    userId: string,
    tokens: string[],
    content: PushContent
) {
    await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
        userId,
        tokens,
        title: content.title,
        body: content.body,
        data: content.data,
        attempt: 1,
    });
}

async function getChatPushState(
    ctx: MutationCtx,
    userId: string,
    conversationId: Id<"conversations">
) {
    return await ctx.db
        .query("chatPushStates")
        .withIndex("by_userId_conversationId", (q) =>
            q.eq("userId", userId).eq("conversationId", conversationId)
        )
        .first();
}

/**
 * Chat anti-spam:
 * 1. If the recipient has the conversation open (presence), no push.
 * 2. If no chat push was sent in the last CHAT_PUSH_WINDOW_MS, or the recipient
 *    already read everything since the last push, push this message right away.
 * 3. Otherwise don't push now: schedule a single grouped push at the end of the
 *    window ("Te envió N mensajes nuevos"), which is skipped if by then the
 *    recipient read the messages or opened the chat.
 */
async function handleChatPush(
    ctx: MutationCtx,
    args: {
        userId: string;
        conversationId: Id<"conversations">;
        notificationId: Id<"notifications">;
        body: string;
        actorId?: string;
        tokens: string[];
    }
) {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.memberIds.includes(args.userId)) {
        return;
    }

    if (await isViewingConversation(ctx, args.userId, args.conversationId)) {
        return;
    }

    const now = Date.now();
    const state = await getChatPushState(ctx, args.userId, args.conversationId);
    const lastPushAt = state?.lastPushAt ?? 0;

    // A grouped push is already scheduled and will include this message.
    if (state?.pendingDigestAt && state.pendingDigestAt > now - CHAT_PUSH_WINDOW_MS) {
        return;
    }

    let sendNow = !state || now - lastPushAt >= CHAT_PUSH_WINDOW_MS;
    if (!sendNow) {
        // Includes the message that triggered this notification. If it's the
        // only unread one, the recipient caught up since the last push.
        const unread = await getUnreadMessagesSince(
            ctx,
            args.conversationId,
            args.userId,
            Math.max(lastPushAt - 60 * 1000, now - CHAT_UNREAD_LOOKBACK_MS)
        );
        sendNow = unread.length <= 1;
    }

    if (sendNow) {
        const senderName = await getDisplayName(ctx, args.actorId);
        await schedulePush(ctx, args.userId, args.tokens, {
            title: senderName || "Nuevo mensaje",
            body: args.body.trim() || "Te envió un mensaje",
            data: {
                type: "message",
                relatedId: args.conversationId,
                notificationId: args.notificationId,
                url: getNotificationUrl("message", args.conversationId),
            },
        });
        if (state) {
            await ctx.db.patch(state._id, { lastPushAt: now, pendingDigestAt: undefined });
        } else {
            await ctx.db.insert("chatPushStates", {
                userId: args.userId,
                conversationId: args.conversationId,
                lastPushAt: now,
            });
        }
        return;
    }

    const digestAt = Math.max(lastPushAt + CHAT_PUSH_WINDOW_MS, now);
    await ctx.scheduler.runAt(digestAt, internal.notifications.flushChatPush, {
        userId: args.userId,
        conversationId: args.conversationId,
    });
    if (state) {
        await ctx.db.patch(state._id, { pendingDigestAt: digestAt });
    }
}

async function schedulePushForNotification(
    ctx: MutationCtx,
    args: {
        notificationId: Id<"notifications">;
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        relatedId?: string;
        actorId?: string;
    }
) {
    const tokens = await getDeliverableTokens(ctx, args.userId);
    if (tokens.length === 0) {
        return;
    }

    if (args.type === "message" && args.relatedId) {
        const conversationId = ctx.db.normalizeId("conversations", args.relatedId);
        if (conversationId) {
            await handleChatPush(ctx, {
                userId: args.userId,
                conversationId,
                notificationId: args.notificationId,
                body: args.body,
                actorId: args.actorId,
                tokens,
            });
            return;
        }
    }

    await schedulePush(ctx, args.userId, tokens, {
        title: args.title,
        body: args.body,
        data: {
            type: args.type,
            relatedId: args.relatedId,
            notificationId: args.notificationId,
            url: getNotificationUrl(args.type, args.relatedId),
        },
    });
}

// Create a notification (internal, called by other functions).
// Also schedules a push to the user's devices; push failures never affect this mutation.
export const createNotification = internalMutation({
    args: {
        userId: v.string(),
        type: notificationTypeValidator,
        title: v.string(),
        body: v.string(),
        relatedId: v.optional(v.string()),
        // Who triggered the notification (e.g. message sender). Used for the push title.
        actorId: v.optional(v.string()),
    },
    returns: v.id("notifications"),
    handler: async (ctx, args) => {
        const notificationId = await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            title: args.title,
            body: args.body,
            relatedId: args.relatedId,
            read: false,
            createdAt: Date.now(),
        });

        try {
            await schedulePushForNotification(ctx, {
                notificationId,
                userId: args.userId,
                type: args.type,
                title: args.title,
                body: args.body,
                relatedId: args.relatedId,
                actorId: args.actorId,
            });
        } catch (error) {
            console.error("Error scheduling push notification:", error);
        }

        return notificationId;
    },
});

// Sends the grouped chat push scheduled by `handleChatPush`.
export const flushChatPush = internalMutation({
    args: {
        userId: v.string(),
        conversationId: v.id("conversations"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const state = await getChatPushState(ctx, args.userId, args.conversationId);
        if (!state) {
            return null;
        }
        await ctx.db.patch(state._id, { pendingDigestAt: undefined });

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.memberIds.includes(args.userId)) {
            return null;
        }

        const tokens = await getDeliverableTokens(ctx, args.userId);
        if (tokens.length === 0) {
            return null;
        }

        if (await isViewingConversation(ctx, args.userId, args.conversationId)) {
            return null;
        }

        const now = Date.now();
        const unread = await getUnreadMessagesSince(
            ctx,
            args.conversationId,
            args.userId,
            Math.max(state.lastPushAt, now - CHAT_UNREAD_LOOKBACK_MS)
        );
        if (unread.length === 0) {
            return null;
        }

        // `unread` is newest first.
        const latest = unread[0];
        const senderIds = new Set(unread.map((message) => message.senderId));
        const senderName =
            senderIds.size === 1 ? await getDisplayName(ctx, latest.senderId) : undefined;
        const count = unread.length;
        const body =
            count === 1
                ? describeMessage(latest)
                : senderName
                  ? `Te envió ${count} mensajes nuevos`
                  : `Tenés ${count} mensajes nuevos`;

        await schedulePush(ctx, args.userId, tokens, {
            title: senderName || "Nuevos mensajes",
            body,
            data: {
                type: "message",
                relatedId: args.conversationId,
                url: getNotificationUrl("message", args.conversationId),
            },
        });
        await ctx.db.patch(state._id, { lastPushAt: now });
        return null;
    },
});

type ExpoPushTicket =
    | { status: "ok"; id: string }
    | {
          status: "error";
          message?: string;
          details?: { error?: string; expoPushToken?: string };
      };

function getExpoHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    // Optional: required only if "Enhanced push security" is enabled in Expo.
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
}

// Sends a push to the given Expo tokens. Never throws: failures are logged,
// transient errors are retried, and unregistered devices are cleaned up.
export const sendPushNotification = internalAction({
    args: {
        userId: v.string(),
        tokens: v.array(v.string()),
        title: v.string(),
        body: v.string(),
        data: pushDataValidator,
        attempt: v.optional(v.number()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const tokens = [...new Set(args.tokens)].filter(isExpoPushToken);
        if (tokens.length === 0) {
            return null;
        }
        const attempt = args.attempt ?? 1;

        const messages = tokens.map((token) => ({
            to: token,
            title: args.title,
            body: args.body,
            data: args.data,
            sound: "default" as const,
            priority: "high" as const,
            channelId: ANDROID_CHANNEL_ID,
        }));

        const retry = async (reason: string) => {
            if (attempt >= MAX_SEND_ATTEMPTS) {
                console.error(`Push send failed after ${attempt} attempts: ${reason}`);
                return;
            }
            console.warn(`Push send failed (attempt ${attempt}), retrying: ${reason}`);
            await ctx.scheduler.runAfter(
                attempt * 30 * 1000,
                internal.notifications.sendPushNotification,
                { ...args, tokens, attempt: attempt + 1 }
            );
        };

        let response: Response;
        try {
            response = await fetch(EXPO_PUSH_SEND_URL, {
                method: "POST",
                headers: getExpoHeaders(),
                body: JSON.stringify(messages),
            });
        } catch (error) {
            await retry(error instanceof Error ? error.message : String(error));
            return null;
        }

        if (response.status === 429 || response.status >= 500) {
            await retry(`HTTP ${response.status}`);
            return null;
        }

        let payload: { data?: ExpoPushTicket[]; errors?: unknown };
        try {
            payload = await response.json();
        } catch {
            console.error(`Invalid response from Expo push API (HTTP ${response.status})`);
            return null;
        }

        if (!response.ok || !Array.isArray(payload.data)) {
            console.error("Expo push API error:", response.status, JSON.stringify(payload.errors ?? payload));
            return null;
        }

        const invalidTokens: string[] = [];
        const receipts: { id: string; token: string }[] = [];
        payload.data.forEach((ticket, index) => {
            const token = tokens[index];
            if (!token) {
                return;
            }
            if (ticket.status === "ok") {
                receipts.push({ id: ticket.id, token });
            } else if (ticket.details?.error === "DeviceNotRegistered") {
                invalidTokens.push(ticket.details.expoPushToken || token);
            } else {
                console.warn("Push ticket error:", ticket.details?.error, ticket.message);
            }
        });

        if (invalidTokens.length > 0) {
            await ctx.runMutation(internal.notifications.removePushTokens, {
                tokens: invalidTokens,
            });
        }

        if (receipts.length > 0) {
            await ctx.scheduler.runAfter(
                RECEIPT_CHECK_DELAY_MS,
                internal.notifications.checkPushReceipts,
                { receipts }
            );
        }

        return null;
    },
});

// Checks delivery receipts; APNs/FCM may report DeviceNotRegistered only here.
export const checkPushReceipts = internalAction({
    args: {
        receipts: v.array(v.object({ id: v.string(), token: v.string() })),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        if (args.receipts.length === 0) {
            return null;
        }
        try {
            const response = await fetch(EXPO_PUSH_RECEIPTS_URL, {
                method: "POST",
                headers: getExpoHeaders(),
                body: JSON.stringify({ ids: args.receipts.map((receipt) => receipt.id) }),
            });
            if (!response.ok) {
                console.warn("Expo receipts API error:", response.status);
                return null;
            }
            const payload: {
                data?: Record<
                    string,
                    { status: "ok" | "error"; message?: string; details?: { error?: string } }
                >;
            } = await response.json();
            const data = payload.data ?? {};

            const invalidTokens: string[] = [];
            for (const receipt of args.receipts) {
                const result = data[receipt.id];
                if (result?.status !== "error") {
                    continue;
                }
                if (result.details?.error === "DeviceNotRegistered") {
                    invalidTokens.push(receipt.token);
                } else {
                    console.warn("Push receipt error:", result.details?.error, result.message);
                }
            }

            if (invalidTokens.length > 0) {
                await ctx.runMutation(internal.notifications.removePushTokens, {
                    tokens: invalidTokens,
                });
            }
        } catch (error) {
            console.error("Error checking push receipts:", error);
        }
        return null;
    },
});

// Removes push tokens that Expo reported as no longer registered.
export const removePushTokens = internalMutation({
    args: {
        tokens: v.array(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const token of new Set(args.tokens)) {
            const devices = await ctx.db
                .query("pushDevices")
                .withIndex("by_token", (q) => q.eq("token", token))
                .collect();
            for (const device of devices) {
                await ctx.db.delete(device._id);
            }

            const profiles = await ctx.db
                .query("profiles")
                .withIndex("by_pushToken", (q) => q.eq("pushToken", token))
                .collect();
            for (const profile of profiles) {
                await ctx.db.patch(profile._id, { pushToken: undefined });
            }
        }
        return null;
    },
});

// ============================================================================
// Client-facing push device / preference APIs
// ============================================================================

// Register this device's Expo push token for the current user.
// Also keeps `profiles.pushToken` up to date for compatibility.
export const registerPushToken = mutation({
    args: {
        token: v.string(),
        platform: v.optional(pushPlatformValidator),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }
        const userId = user._id as string;
        const token = args.token.trim();
        if (!isExpoPushToken(token)) {
            throw new Error("Invalid push token");
        }
        const now = Date.now();

        // A device belongs to the account signed in on it: detach from other users.
        const existing = await ctx.db
            .query("pushDevices")
            .withIndex("by_token", (q) => q.eq("token", token))
            .collect();
        let ownDevice: Doc<"pushDevices"> | null = null;
        for (const device of existing) {
            if (device.userId === userId && !ownDevice) {
                ownDevice = device;
            } else {
                await ctx.db.delete(device._id);
            }
        }
        const legacyProfiles = await ctx.db
            .query("profiles")
            .withIndex("by_pushToken", (q) => q.eq("pushToken", token))
            .collect();
        for (const profile of legacyProfiles) {
            if (profile.userId !== userId) {
                await ctx.db.patch(profile._id, { pushToken: undefined });
            }
        }

        if (ownDevice) {
            await ctx.db.patch(ownDevice._id, {
                platform: args.platform ?? ownDevice.platform,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("pushDevices", {
                userId,
                token,
                platform: args.platform,
                createdAt: now,
                updatedAt: now,
            });
        }

        // Prune oldest devices beyond the limit.
        const devices = await ctx.db
            .query("pushDevices")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        if (devices.length > MAX_PUSH_DEVICES_PER_USER) {
            const stale = devices
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(MAX_PUSH_DEVICES_PER_USER);
            for (const device of stale) {
                await ctx.db.delete(device._id);
            }
        }

        const profile = await getProfile(ctx, userId);
        if (profile && profile.pushToken !== token) {
            await ctx.db.patch(profile._id, { pushToken: token, updatedAt: now });
        }

        return null;
    },
});

// Unregister this device (call before signing out).
export const unregisterPushToken = mutation({
    args: {
        token: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return null;
        }
        const userId = user._id as string;

        const devices = await ctx.db
            .query("pushDevices")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .collect();
        for (const device of devices) {
            if (device.userId === userId) {
                await ctx.db.delete(device._id);
            }
        }

        const profile = await getProfile(ctx, userId);
        if (profile && profile.pushToken === args.token) {
            await ctx.db.patch(profile._id, { pushToken: undefined, updatedAt: Date.now() });
        }

        return null;
    },
});

// Persist the "Notificaciones push" switch from settings.
export const setPushNotificationsEnabled = mutation({
    args: {
        enabled: v.boolean(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }
        const profile = await getProfile(ctx, user._id as string);
        if (!profile) {
            throw new Error("Profile not found");
        }
        await ctx.db.patch(profile._id, {
            pushNotificationsEnabled: args.enabled,
            updatedAt: Date.now(),
        });
        return null;
    },
});

// Get notifications for current user
export const listForUser = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(
        v.object({
            _id: v.id("notifications"),
            _creationTime: v.number(),
            userId: v.string(),
            type: notificationTypeValidator,
            title: v.string(),
            body: v.string(),
            relatedId: v.optional(v.string()),
            read: v.boolean(),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        try {
            const user = await authComponent.getAuthUser(ctx);
            if (!user) {
                return [];
            }

            const limit = args.limit || 50;

            return await ctx.db
                .query("notifications")
                .withIndex("by_userId_createdAt", (q) =>
                    q.eq("userId", user._id as string)
                )
                .order("desc")
                .take(limit);
        } catch {
            return [];
        }
    },
});

// Get unread count for current user
export const getUnreadCount = query({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {

        try {
            const user = await authComponent.getAuthUser(ctx);
            if (!user) {
                return 0;
            }

            const unreadNotifications = await ctx.db
                .query("notifications")
                .withIndex("by_userId_read", (q) =>
                    q.eq("userId", user._id as string).eq("read", false)
                )
                .collect();

            return unreadNotifications.length;
        } catch (error) {
            console.error("Error getting unread count:", error);
            return 0;
        }
    },
});

// Mark notification as read
export const markAsRead = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) {
            throw new Error("Notification not found");
        }

        if (notification.userId !== (user._id as string)) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.notificationId, {
            read: true,
        });

        return null;
    },
});

// Mark all notifications as read for current user
export const markAllAsRead = mutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const unreadNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId_read", (q) =>
                q.eq("userId", user._id as string).eq("read", false)
            )
            .collect();

        for (const notification of unreadNotifications) {
            await ctx.db.patch(notification._id, {
                read: true,
            });
        }

        return null;
    },
});
