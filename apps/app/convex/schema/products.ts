import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productsTable = defineTable({
    authorId: v.string(), // References Better Auth user ID
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("rent"), v.literal("sell")), // Rent or Sell
    category: v.optional(v.string()), // Category for filtering
    price: v.optional(v.number()),
    currency: v.optional(v.string()), // Currency code (e.g., "USD", "MXN", "EUR")
    mediaIds: v.optional(v.array(v.id("_storage"))), // Array of file storage IDs
    viewCount: v.optional(v.number()),
    location: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
        accuracy: v.optional(v.number()),
        address: v.optional(v.string()),
        label: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_authorId", ["authorId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_category_createdAt", ["category", "createdAt"])
    .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["category", "type"],
    });
