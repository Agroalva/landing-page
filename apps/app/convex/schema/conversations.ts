import { defineTable } from "convex/server";
import { v } from "convex/values";

export const conversationsTable = defineTable({
    memberIds: v.array(v.string()), // Array of Better Auth user IDs
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
})
    .index("by_memberIds", ["memberIds"])
    .index("by_lastMessageAt", ["lastMessageAt"]);

