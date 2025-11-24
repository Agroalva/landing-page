import { defineTable } from "convex/server";
import { v } from "convex/values";

export const profilesTable = defineTable({
    userId: v.string(), // References Better Auth user ID
    displayName: v.string(),
    avatarId: v.optional(v.id("_storage")), // Reference to Convex file storage
    bio: v.optional(v.string()),
    phoneNumber: v.optional(v.string()), // Phone number for contact
    pushToken: v.optional(v.string()), // Expo push notification token
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_userId", ["userId"])
    .index("by_displayName", ["displayName"]);

