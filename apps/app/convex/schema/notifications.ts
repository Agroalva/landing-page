import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notificationsTable = defineTable({
    userId: v.string(), // References Better Auth user ID
    type: v.union(
        v.literal("message"),
        v.literal("favorite"),
        v.literal("comment"),
        v.literal("like")
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
