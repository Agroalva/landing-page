import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

const profileValidator = v.object({
    _id: v.id("profiles"),
    _creationTime: v.number(),
    userId: v.string(),
    displayName: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    avatarId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    pushToken: v.optional(v.string()),
    ratingSum: v.optional(v.number()),
    ratingCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
});

const toPublicProfile = (profile: any) => ({
    _id: profile._id,
    _creationTime: profile._creationTime,
    userId: profile.userId,
    displayName: profile.displayName,
    role: profile.role,
    avatarId: profile.avatarId,
    bio: profile.bio,
    ratingSum: profile.ratingSum,
    ratingCount: profile.ratingCount,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
});

// Get current user's profile
export const getMe = query({
    args: {},
    returns: v.union(profileValidator, v.null()),
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

// Get a user's profile by userId (public view omits contact fields when unauthenticated)
export const getByUserId = query({
    args: {
        userId: v.string(),
    },
    returns: v.union(profileValidator, v.null()),
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            return null;
        }

        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return toPublicProfile(profile);
        }

        return profile;
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
                    role: "user",
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
                role: "user",
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

        // 1) Remove reviews written by this user and repair recipient aggregates.
        const authoredReviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewerId", (q) => q.eq("reviewerId", userId))
            .collect();
        for (const review of authoredReviews) {
            if (review.status === "published") {
                const reviewedProfile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", review.reviewedUserId))
                    .first();
                if (reviewedProfile) {
                    await ctx.db.patch(reviewedProfile._id, {
                        ratingSum: Math.max(0, (reviewedProfile.ratingSum || 0) - review.rating),
                        ratingCount: Math.max(0, (reviewedProfile.ratingCount || 0) - 1),
                        updatedAt: Date.now(),
                    });
                }
            }

            const reports = await ctx.db
                .query("reviewReports")
                .withIndex("by_reviewId", (q) => q.eq("reviewId", review._id))
                .collect();
            for (const report of reports) {
                await ctx.db.delete(report._id);
            }
            await ctx.db.delete(review._id);
        }

        // 2) Remove reviews received by this user.
        for (const status of ["published", "hidden", "deleted"] as const) {
            const receivedReviews = await ctx.db
                .query("reviews")
                .withIndex("by_reviewedUserId_status_createdAt", (q) =>
                    q.eq("reviewedUserId", userId).eq("status", status),
                )
                .collect();
            for (const review of receivedReviews) {
                const reports = await ctx.db
                    .query("reviewReports")
                    .withIndex("by_reviewId", (q) => q.eq("reviewId", review._id))
                    .collect();
                for (const report of reports) {
                    await ctx.db.delete(report._id);
                }
                await ctx.db.delete(review._id);
            }
        }

        const submittedReports = await ctx.db
            .query("reviewReports")
            .withIndex("by_reportedBy", (q) => q.eq("reportedBy", userId))
            .collect();
        for (const report of submittedReports) {
            await ctx.db.delete(report._id);
        }

        // 3) Delete profile
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
        if (profile) {
            await ctx.db.delete(profile._id);
        }

        // 4) Delete products authored by user and their favorites
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

        // 5) Delete favorites created by the user
        const myFavorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        for (const favorite of myFavorites) {
            await ctx.db.delete(favorite._id);
        }

        // 6) Delete notifications for the user
        const myNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        for (const notification of myNotifications) {
            await ctx.db.delete(notification._id);
        }

        // 7) Clean up conversations and messages involving this user
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

export const setProfileRoles = internalMutation({
    args: {
        updates: v.array(
            v.object({
                userId: v.string(),
                role: v.union(v.literal("user"), v.literal("admin")),
            })
        ),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const update of args.updates) {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", update.userId))
                .first();

            if (!profile) {
                continue;
            }

            await ctx.db.patch(profile._id, {
                role: update.role,
                updatedAt: Date.now(),
            });
        }

        return null;
    },
});
