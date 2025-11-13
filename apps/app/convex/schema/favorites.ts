import { defineTable } from "convex/server";
import { v } from "convex/values";

export const favoritesTable = defineTable({
    userId: v.string(), // References Better Auth user ID
    productId: v.id("products"), // References product ID
    createdAt: v.number(),
})
    .index("by_userId", ["userId"])
    .index("by_productId", ["productId"])
    .index("by_userId_productId", ["userId", "productId"]);

