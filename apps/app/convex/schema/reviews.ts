import { defineTable } from "convex/server";
import { v } from "convex/values";

export const reviewsTable = defineTable({
    reviewerId: v.string(),
    reviewedUserId: v.string(),
    conversationId: v.id("conversations"),
    productId: v.optional(v.id("products")),
    productName: v.optional(v.string()),
    rating: v.number(),
    comment: v.string(),
    status: v.union(
        v.literal("published"),
        v.literal("hidden"),
        v.literal("deleted"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_reviewedUserId_status_createdAt", [
        "reviewedUserId",
        "status",
        "createdAt",
    ])
    .index("by_reviewerId", ["reviewerId"])
    .index("by_reviewerId_reviewedUserId", ["reviewerId", "reviewedUserId"])
    .index("by_conversationId", ["conversationId"]);

export const reviewReportsTable = defineTable({
    reviewId: v.id("reviews"),
    reportedBy: v.string(),
    reason: v.union(
        v.literal("spam"),
        v.literal("harassment"),
        v.literal("inappropriate"),
        v.literal("false_information"),
        v.literal("other"),
    ),
    details: v.optional(v.string()),
    status: v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("dismissed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_reviewId", ["reviewId"])
    .index("by_reviewId_reportedBy", ["reviewId", "reportedBy"])
    .index("by_reportedBy", ["reportedBy"])
    .index("by_status_createdAt", ["status", "createdAt"]);
