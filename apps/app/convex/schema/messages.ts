import { defineTable } from "convex/server";
import { v } from "convex/values";

export const messagesTable = defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(), // References Better Auth user ID
    text: v.string(),
    mediaId: v.optional(v.id("_storage")),
    // True when `text` is a server-generated placeholder (e.g. a photo sent
    // without a caption). Old app versions only render `text`, so they show the
    // placeholder; newer clients hide it and render the photo instead.
    textIsFallback: v.optional(v.boolean()),
    readBy: v.optional(v.array(v.string())), // Array of user IDs who have read this message
    createdAt: v.number(),
})
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_senderId", ["conversationId", "senderId"])
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"]);
