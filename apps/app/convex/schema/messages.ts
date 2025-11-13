import { defineTable } from "convex/server";
import { v } from "convex/values";

export const messagesTable = defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(), // References Better Auth user ID
    text: v.string(),
    mediaId: v.optional(v.id("_storage")),
    createdAt: v.number(),
})
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"]);

