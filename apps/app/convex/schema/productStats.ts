import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productContactChannelValidator = v.union(
    v.literal("whatsapp"),
    v.literal("call"),
    v.literal("message"),
);

export const productContactSourceValidator = v.union(
    v.literal("app"),
    v.literal("web"),
);

// One row per recorded contact. Used to de-duplicate repeated taps from the
// same user and as an audit trail. Never read by public listing queries.
export const productContactEventsTable = defineTable({
    productId: v.id("products"),
    authorId: v.string(), // Owner of the product (Better Auth user ID)
    userId: v.string(), // User who contacted (Better Auth user ID)
    channel: productContactChannelValidator,
    source: v.optional(productContactSourceValidator),
    createdAt: v.number(),
})
    .index("by_productId_userId_channel_createdAt", [
        "productId",
        "userId",
        "channel",
        "createdAt",
    ])
    .index("by_productId_createdAt", ["productId", "createdAt"]);

// Lifetime contact counters per product. Kept outside the `products` document
// so contact writes never invalidate feed/search queries or contend with
// product edits.
export const productStatsTable = defineTable({
    productId: v.id("products"),
    authorId: v.string(),
    whatsappCount: v.number(),
    callCount: v.number(),
    messageCount: v.number(),
    lastContactAt: v.optional(v.number()),
    updatedAt: v.number(),
})
    .index("by_productId", ["productId"]);

// Daily counters per product (day bucket in Argentina time, "YYYY-MM-DD").
export const productDailyStatsTable = defineTable({
    productId: v.id("products"),
    authorId: v.string(),
    day: v.string(),
    views: v.number(),
    whatsapp: v.number(),
    calls: v.number(),
    messages: v.number(),
    updatedAt: v.number(),
})
    .index("by_productId_day", ["productId", "day"]);
