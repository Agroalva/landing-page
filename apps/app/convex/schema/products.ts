import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productsTable = defineTable({
    authorId: v.string(), // References Better Auth user ID
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("rent"), v.literal("sell")), // Rent or Sell
    price: v.optional(v.number()),
    mediaIds: v.optional(v.array(v.id("_storage"))), // Array of file storage IDs
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_authorId", ["authorId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_type", ["type"]);
