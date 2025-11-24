import { defineTable } from "convex/server";
import { v } from "convex/values";

export const conversationsTable = defineTable({
    memberIds: v.array(v.string()), // Array of Better Auth user IDs
    lastMessageAt: v.optional(v.number()),
    lastMessageText: v.optional(v.string()), // Preview of last message
    lastMessageSenderId: v.optional(v.string()), // ID of sender of last message
    createdAt: v.number(),
})
    .index("by_memberIds", ["memberIds"])
    .index("by_lastMessageAt", ["lastMessageAt"]);

