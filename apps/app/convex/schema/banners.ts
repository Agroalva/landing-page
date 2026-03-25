import { defineTable } from "convex/server";
import { v } from "convex/values";

export const bannersTable = defineTable({
    imageStorageId: v.id("_storage"),
    targetUrl: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdByUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_isActive_sortOrder", ["isActive", "sortOrder"])
    .index("by_sortOrder", ["sortOrder"]);
