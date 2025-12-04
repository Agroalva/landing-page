import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Keep this validator in sync with the products table schema in
// `convex/schema/products.ts` to avoid ReturnsValidationError when
// returning product documents from queries.
const productValidator = v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    authorId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("rent"), v.literal("sell")),
    category: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    mediaIds: v.optional(v.array(v.id("_storage"))),
    viewCount: v.optional(v.number()),
    location: v.optional(
        v.object({
            latitude: v.number(),
            longitude: v.number(),
            accuracy: v.optional(v.number()),
            address: v.optional(v.string()),
            label: v.optional(v.string()),
        })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
});

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

            // Create notification for product owner
            if (product.authorId !== (user._id as string)) {
                await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
                    userId: product.authorId,
                    type: "favorite",
                    title: "Nuevo favorito",
                    body: `A alguien le gustó tu producto: ${product.name}`,
                    relatedId: args.productId,
                });
            }

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

// Return favorite status for a batch of product IDs
export const getFavoritesMap = query({
    args: {
        productIds: v.array(v.id("products")),
    },
    returns: v.array(
        v.object({
            productId: v.id("products"),
            isFavorite: v.boolean(),
        })
    ),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return args.productIds.map((productId) => ({
                productId,
                isFavorite: false,
            }));
        }

        const favoriteSet = new Set<Id<"products">>();
        for (const productId of args.productIds) {
            const favorite = await ctx.db
                .query("favorites")
                .withIndex("by_userId_productId", (q) =>
                    q.eq("userId", user._id as string).eq("productId", productId)
                )
                .first();

            if (favorite) {
                favoriteSet.add(productId);
            }
        }

        return args.productIds.map((productId) => ({
            productId,
            isFavorite: favoriteSet.has(productId),
        }));
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

// Get favorite counts for multiple products
export const getFavoriteCounts = query({
    args: {
        productIds: v.array(v.id("products")),
    },
    returns: v.array(
        v.object({
            productId: v.id("products"),
            count: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        const counts: Record<string, number> = {};

        for (const productId of args.productIds) {
            const favorites = await ctx.db
                .query("favorites")
                .withIndex("by_productId", (q) => q.eq("productId", productId))
                .collect();

            counts[productId] = favorites.length;
        }

        return args.productIds.map((productId) => ({
            productId,
            count: counts[productId] || 0,
        }));
    },
});

// Get favorite products (with product data) for current user
export const listFavoriteProducts = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(
        v.object({
            favoriteId: v.id("favorites"),
            product: productValidator,
        })
    ),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        const limit = args.limit || 50;

        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
            .order("desc")
            .take(limit);

        const results: Array<{ favoriteId: Id<"favorites">; product: Doc<"products"> }> =
            [];

        for (const favorite of favorites) {
            const product = await ctx.db.get(favorite.productId);
            if (product) {
                results.push({
                    favoriteId: favorite._id,
                    product,
                });
            }
        }

        return results;
    },
});

