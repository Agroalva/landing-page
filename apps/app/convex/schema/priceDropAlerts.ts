import { defineTable } from "convex/server";
import { v } from "convex/values";

// Lowest price already announced to a listing's favoriters. A new alert is
// only sent when the price goes below it, so raising and lowering the price
// again doesn't re-notify anyone.
export const priceDropAlertsTable = defineTable({
    productId: v.id("products"),
    currency: v.string(),
    lowestNotifiedPrice: v.number(),
    lastNotifiedAt: v.number(),
})
    .index("by_productId", ["productId"]);
