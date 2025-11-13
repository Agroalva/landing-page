import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Check if current user has favorited a product
export const isFavorite = query({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return false;
        }

        const favorite = await ctx.db
            .query("favorites")
            .withIndex("by_userId_productId", (q) =>
                q.eq("userId", user._id as string).eq("productId", args.productId)
            )
            .first();

        return favorite !== null;
    },
});

// Toggle favorite status for a product
export const toggleFavorite = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Check if product exists
        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new Error("Product not found");
        }

        // Check if favorite already exists
        const existingFavorite = await ctx.db
            .query("favorites")
            .withIndex("by_userId_productId", (q) =>
                q.eq("userId", user._id as string).eq("productId", args.productId)
            )
            .first();

        if (existingFavorite) {
            // Remove favorite
            await ctx.db.delete(existingFavorite._id);
            return false;
        } else {
            // Add favorite
            await ctx.db.insert("favorites", {
                userId: user._id as string,
                productId: args.productId,
                createdAt: Date.now(),
            });
            return true;
        }
    },
});

// Get all favorites for current user
export const getFavorites = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
            .order("desc")
            .collect();

        return favorites;
    },
});

// Get favorite count for a product
export const getFavoriteCount = query({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .collect();

        return favorites.length;
    },
});

