import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notificationsTable = defineTable({
    userId: v.string(), // References Better Auth user ID
    type: v.union(
        v.literal("message"),
        v.literal("favorite"),
        v.literal("comment"),
        v.literal("like"),
        v.literal("review"),
        // Added in 1.2.11. Older app versions render unknown types with a
        // generic icon and do nothing on tap (see app/notifications.tsx).
        v.literal("saved_search"),
        v.literal("price_drop")
    ),
    title: v.string(),
    body: v.string(),
    relatedId: v.optional(v.string()), // ID of related entity (conversation, product, etc.)
    read: v.boolean(),
    createdAt: v.number(),
})
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"])
    .index("by_userId_createdAt", ["userId", "createdAt"]);

// Push devices registered by the app (one row per Expo push token).
// Additive companion to `profiles.pushToken`, which old app versions still write.
export const pushDevicesTable = defineTable({
    userId: v.string(), // References Better Auth user ID
    token: v.string(), // Expo push token: ExponentPushToken[...]
    platform: v.optional(
        v.union(v.literal("ios"), v.literal("android"), v.literal("web"))
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_userId", ["userId"])
    .index("by_token", ["token"]);

// Per-recipient, per-conversation push throttle state for chat messages.
export const chatPushStatesTable = defineTable({
    userId: v.string(), // Recipient (Better Auth user ID)
    conversationId: v.id("conversations"),
    lastPushAt: v.number(), // Last time a chat push was sent for this conversation
    pendingDigestAt: v.optional(v.number()), // When a grouped push is scheduled, if any
})
    .index("by_userId_conversationId", ["userId", "conversationId"]);
