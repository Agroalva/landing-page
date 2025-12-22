import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Get current user's profile
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await authComponent.getAuthUser(ctx);
            if (!user) {
                return null;
            }

            return await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
                .first();
        } catch {
            // User is not authenticated or session is invalid
            return null;
        }
    },
});

// Get a user's profile by userId (public, for displaying other users' profiles)
export const getByUserId = query({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

// Ensure profile exists (creates if missing, called after sign-up)
export const ensureProfile = mutation({
    args: {},
    returns: v.union(v.id("profiles"), v.null()),
    handler: async (ctx) => {
        try {
            const user = await authComponent.getAuthUser(ctx);
            if (!user) {
                return null;
            }

            let profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
                .first();

            if (!profile) {
                // Create profile with default values from user data
                return await ctx.db.insert("profiles", {
                    userId: user._id as string,
                    displayName: user.name || user.email || "User",
                    bio: undefined,
                    avatarId: undefined,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }

            return profile._id;
        } catch {
            // User is not authenticated or session is invalid
            return null;
        }
    },
});

// Update current user's profile
export const updateProfile = mutation({
    args: {
        displayName: v.optional(v.string()),
        bio: v.optional(v.string()),
        avatarId: v.optional(v.id("_storage")),
        phoneNumber: v.optional(v.string()),
        pushToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
            .first();

        if (!profile) {
            // Create profile if it doesn't exist
            return await ctx.db.insert("profiles", {
                userId: user._id as string,
                displayName: args.displayName || user.email || "User",
                bio: args.bio,
                avatarId: args.avatarId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // Update existing profile
        return await ctx.db.patch(profile._id, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Internal mutation to clean up all Convex data for a user before Better Auth deletes the user.
 * This should be called from Better Auth's beforeDelete callback.
 */
export const cleanupUserData = internalMutation({
    args: {
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = args.userId;

        // 1) Delete profile
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
        if (profile) {
            await ctx.db.delete(profile._id);
        }

        // 2) Delete products authored by user and their favorites
        const products = await ctx.db
            .query("products")
            .withIndex("by_authorId", (q) => q.eq("authorId", userId))
            .collect();

        for (const product of products) {
            const productFavorites = await ctx.db
                .query("favorites")
                .withIndex("by_productId", (q) => q.eq("productId", product._id))
                .collect();
            for (const favorite of productFavorites) {
                await ctx.db.delete(favorite._id);
            }
            await ctx.db.delete(product._id);
        }

        // 3) Delete favorites created by the user
        const myFavorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        for (const favorite of myFavorites) {
            await ctx.db.delete(favorite._id);
        }

        // 4) Delete notifications for the user
        const myNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        for (const notification of myNotifications) {
            await ctx.db.delete(notification._id);
        }

        // 5) Clean up conversations and messages involving this user
        const conversations = await ctx.db.query("conversations").collect();
        for (const conversation of conversations) {
            if (!conversation.memberIds.includes(userId)) {
                continue;
            }

            const updatedMembers = conversation.memberIds.filter((id) => id !== userId);

            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                .collect();

            if (updatedMembers.length === 0) {
                // Delete entire conversation and its messages
                for (const message of messages) {
                    await ctx.db.delete(message._id);
                }
                await ctx.db.delete(conversation._id);
            } else {
                await ctx.db.patch(conversation._id, {
                    memberIds: updatedMembers,
                });

                // Remove this user from readBy arrays
                for (const message of messages) {
                    const readBy = message.readBy || [];
                    if (!readBy.includes(userId)) {
                        continue;
                    }
                    await ctx.db.patch(message._id, {
                        readBy: readBy.filter((id) => id !== userId),
                    });
                }
            }
        }

        return null;
    },
});

