import { defineTable } from "convex/server";
import { v } from "convex/values";

const attributeValue = v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.array(v.string()),
    v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
    })
);

// Optional on purpose: products created before statuses existed have no value
// and must be treated as "active" (see config/listing-status.ts).
export const listingStatusValidator = v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("sold"),
    v.literal("rented"),
);

export const productsTable = defineTable({
    authorId: v.string(), // References Better Auth user ID
    name: v.string(),
    searchText: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.union(v.literal("rent"), v.literal("sell")), // Rent or Sell
    category: v.optional(v.string()), // Category for filtering
    familyId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), attributeValue)),
    price: v.optional(v.number()),
    currency: v.optional(v.string()), // Currency code (e.g., "USD", "MXN", "EUR")
    mediaIds: v.optional(v.array(v.id("_storage"))), // Array of file storage IDs
    viewCount: v.optional(v.number()),
    status: v.optional(listingStatusValidator),
    statusUpdatedAt: v.optional(v.number()),
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
    .index("by_family", ["familyId"])
    .index("by_family_category", ["familyId", "categoryId"])
    .index("by_category", ["category"])
    .index("by_category_createdAt", ["category", "createdAt"])
    .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["category", "type", "familyId", "categoryId"],
    })
    .searchIndex("search_content", {
        searchField: "searchText",
        filterFields: ["category", "type", "familyId", "categoryId"],
    });
