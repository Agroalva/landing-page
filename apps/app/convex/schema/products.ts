import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productsTable = defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
})
    .index("by_createdAt", ["createdAt"]);

