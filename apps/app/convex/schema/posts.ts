import { defineTable } from "convex/server";
import { v } from "convex/values";

export const postsTable = defineTable({
    authorId: v.string(), // References Better Auth user ID
    text: v.string(),
    mediaIds: v.optional(v.array(v.id("_storage"))), // Array of file storage IDs
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_authorId", ["authorId"])
    .index("by_createdAt", ["createdAt"]);

