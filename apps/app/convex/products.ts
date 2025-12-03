import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { authComponent } from "./auth";

// Create a new product
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(v.literal("rent"), v.literal("sell")),
        category: v.optional(v.string()),
        price: v.optional(v.number()),
        currency: v.optional(v.string()),
        mediaIds: v.optional(v.array(v.id("_storage"))),
        location: v.optional(v.object({
            latitude: v.number(),
            longitude: v.number(),
            accuracy: v.optional(v.number()),
            address: v.optional(v.string()),
            label: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        if (!args.name.trim()) {
            throw new Error("Product name cannot be empty");
        }

        return await ctx.db.insert("products", {
            authorId: user._id as string,
            name: args.name.trim(),
            description: args.description?.trim(),
            type: args.type,
            category: args.category,
            price: args.price,
            currency: args.currency,
            mediaIds: args.mediaIds || [],
            location: args.location,
            viewCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Get feed of products (chronological) with optional category filter and pagination
export const feed = query({
    args: {
        paginationOpts: paginationOptsValidator,
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.category && args.category !== "Todos") {
            return await ctx.db
                .query("products")
                .withIndex("by_category_createdAt", (q) => 
                    q.eq("category", args.category)
                )
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        return await ctx.db
            .query("products")
            .withIndex("by_createdAt")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Get a single product by ID
export const getById = query({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.productId);
    },
});

// Get products by a specific user
export const byUser = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        
        return await ctx.db
            .query("products")
            .withIndex("by_authorId", (q) => q.eq("authorId", args.userId))
            .order("desc")
            .take(limit);
    },
});

// Delete a product (only by author)
export const deleteProduct = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new Error("Product not found");
        }

        if (product.authorId !== (user._id as string)) {
            throw new Error("Not authorized to delete this product");
        }

        await ctx.db.delete(args.productId);
    },
});

// Increment view count for a product
export const incrementViewCount = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new Error("Product not found");
        }

        const currentViewCount = product.viewCount || 0;
        await ctx.db.patch(args.productId, {
            viewCount: currentViewCount + 1,
        });
    },
});

// Update a product (only by author)
export const update = mutation({
    args: {
        productId: v.id("products"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        type: v.optional(v.union(v.literal("rent"), v.literal("sell"))),
        category: v.optional(v.string()),
        price: v.optional(v.number()),
        currency: v.optional(v.string()),
        mediaIds: v.optional(v.array(v.id("_storage"))),
        location: v.optional(v.object({
            latitude: v.number(),
            longitude: v.number(),
            accuracy: v.optional(v.number()),
            address: v.optional(v.string()),
            label: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new Error("Product not found");
        }

        if (product.authorId !== (user._id as string)) {
            throw new Error("Not authorized to update this product");
        }

        const updates: any = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) {
            if (!args.name.trim()) {
                throw new Error("Product name cannot be empty");
            }
            updates.name = args.name.trim();
        }

        if (args.description !== undefined) {
            updates.description = args.description?.trim();
        }

        if (args.type !== undefined) {
            updates.type = args.type;
        }

        if (args.category !== undefined) {
            updates.category = args.category;
        }

        if (args.price !== undefined) {
            updates.price = args.price;
        }

        if (args.currency !== undefined) {
            updates.currency = args.currency;
        }

        if (args.mediaIds !== undefined) {
            updates.mediaIds = args.mediaIds;
        }

        if (args.location !== undefined) {
            updates.location = args.location;
        }

        await ctx.db.patch(args.productId, updates);
    },
});

// Get all categories with product counts
export const getCategories = query({
    args: {},
    handler: async (ctx) => {
        const allProducts = await ctx.db
            .query("products")
            .collect();
        
        // Count products by category
        const categoryCounts: Record<string, number> = {};
        allProducts.forEach(product => {
            if (product.category) {
                categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
            }
        });
        
        // Convert to array and sort by count (descending)
        const categories = Object.entries(categoryCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        
        return categories;
    },
});

