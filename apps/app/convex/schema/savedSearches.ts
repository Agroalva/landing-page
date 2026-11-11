import { defineTable } from "convex/server";
import { v } from "convex/values";
import { listingFilterFields, listingSortValidator } from "../lib/listingFilterValidators";

export const savedSearchesTable = defineTable({
    userId: v.string(), // References Better Auth user ID
    label: v.string(), // Human summary, e.g. "“sembradora” · Sembradoras · US$ hasta 50.000"
    ...listingFilterFields,
    // Only used to restore the search screen exactly as it was saved.
    topLevel: v.optional(v.string()),
    sort: v.optional(listingSortValidator),
    alertsEnabled: v.boolean(),
    lastAlertAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_userId", ["userId"])
    // Matching a new listing only reads searches whose taxonomy can include it.
    .index("by_alerts_family_category", ["alertsEnabled", "familyId", "categoryId"]);

// One row per (user, listing) already alerted, so a listing never triggers
// two alerts for the same user even if several saved searches match it.
export const savedSearchAlertsTable = defineTable({
    userId: v.string(),
    savedSearchId: v.id("savedSearches"),
    productId: v.id("products"),
    createdAt: v.number(),
})
    .index("by_userId_productId", ["userId", "productId"])
    .index("by_savedSearchId_createdAt", ["savedSearchId", "createdAt"]);
