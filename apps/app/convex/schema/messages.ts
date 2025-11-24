import { defineTable } from "convex/server";
import { v } from "convex/values";

export const messagesTable = defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(), // References Better Auth user ID
    text: v.string(),
    mediaId: v.optional(v.id("_storage")),
    readBy: v.optional(v.array(v.string())), // Array of user IDs who have read this message
    createdAt: v.number(),
})
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"]);

