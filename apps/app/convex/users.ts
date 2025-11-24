import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Get current user's profile
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return null;
        }

        return await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
            .first();
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
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
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

