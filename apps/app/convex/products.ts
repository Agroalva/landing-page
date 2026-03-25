import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { authComponent } from "./auth";
import { getCategoryById } from "../app/config/taxonomy";
import type { AttributeValueMap, CategoryId } from "../app/config/taxonomy";
import { resolveTaxonomyFilter } from "./taxonomy";

const attributeValueValidator = v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.array(v.string()),
    v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
    }),
);

const attributesValidator = v.optional(v.record(v.string(), attributeValueValidator));

const normalizeAttributes = (attributes?: AttributeValueMap | null): AttributeValueMap | undefined => {
    if (!attributes) {
        return undefined;
    }

    const normalized: AttributeValueMap = {};
    for (const [key, rawValue] of Object.entries(attributes)) {
        if (rawValue === undefined || rawValue === null) {
            continue;
        }

        if (typeof rawValue === "string") {
            const trimmed = rawValue.trim();
            if (!trimmed) {
                continue;
            }
            normalized[key] = trimmed;
            continue;
        }

        if (Array.isArray(rawValue)) {
            const cleaned = rawValue
                .map((item) => (typeof item === "string" ? item.trim() : item))
                .filter((item): item is string => typeof item === "string" && item.length > 0);
            if (cleaned.length === 0) {
                continue;
            }
            normalized[key] = cleaned;
            continue;
        }

        if (typeof rawValue === "object") {
            const rangeValue = rawValue as { min?: number; max?: number };
            const hasMin = typeof rangeValue.min === "number";
            const hasMax = typeof rangeValue.max === "number";
            if (!hasMin && !hasMax) {
                continue;
            }
            normalized[key] = {
                ...(hasMin ? { min: rangeValue.min } : {}),
                ...(hasMax ? { max: rangeValue.max } : {}),
            };
            continue;
        }

        normalized[key] = rawValue as any;
    }

    return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const getLegacyCategoryLabel = (
    categoryId?: CategoryId,
    fallback?: string | null,
) => {
    if (categoryId) {
        return getCategoryById(categoryId)?.label ?? fallback ?? undefined;
    }
    return fallback ?? undefined;
};

const publicLocationValidator = v.optional(v.object({
    address: v.optional(v.string()),
    label: v.optional(v.string()),
}));

const shareProductValidator = v.object({
    _id: v.id("products"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    type: v.union(v.literal("rent"), v.literal("sell")),
    category: v.optional(v.string()),
    familyId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    location: publicLocationValidator,
    createdAt: v.number(),
    primaryImageUrl: v.optional(v.string()),
    authorDisplayName: v.optional(v.string()),
});

const applyListingTypeFilter = (query: any, listingType?: "rent" | "sell") => {
    if (!listingType) {
        return query;
    }

    return query.filter((q: any) => q.eq(q.field("type"), listingType));
};

// Create a new product
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(v.literal("rent"), v.literal("sell")),
        category: v.optional(v.string()),
        familyId: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        attributes: attributesValidator,
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

        if (!args.mediaIds || args.mediaIds.length === 0) {
            throw new Error("Debes agregar al menos una foto de portada");
        }

        const { resolvedFamily, resolvedCategory } = resolveTaxonomyFilter(args.familyId, args.categoryId);
        const normalizedAttributes = normalizeAttributes(args.attributes);
        const legacyCategory = getLegacyCategoryLabel(resolvedCategory, args.category);

        return await ctx.db.insert("products", {
            authorId: user._id as string,
            name: args.name.trim(),
            description: args.description?.trim(),
            type: args.type,
            category: legacyCategory,
            familyId: resolvedFamily,
            categoryId: resolvedCategory,
            attributes: normalizedAttributes,
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
        familyId: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        legacyCategory: v.optional(v.string()),
        listingType: v.optional(v.union(v.literal("rent"), v.literal("sell"))),
    },
    handler: async (ctx, args) => {
        const { resolvedFamily, resolvedCategory } = resolveTaxonomyFilter(args.familyId, args.categoryId);

        if (resolvedCategory) {
            const query = applyListingTypeFilter(
                ctx.db
                    .query("products")
                    .withIndex("by_family_category", (q) =>
                    q.eq("familyId", resolvedFamily as string).eq("categoryId", resolvedCategory as string),
                    ),
                args.listingType,
            );

            return await query
                .order("desc")
                .paginate(args.paginationOpts);
        }

        if (resolvedFamily) {
            const query = applyListingTypeFilter(
                ctx.db
                    .query("products")
                    .withIndex("by_family", (q) => q.eq("familyId", resolvedFamily as string)),
                args.listingType,
            );

            return await query
                .order("desc")
                .paginate(args.paginationOpts);
        }

        if (args.legacyCategory && args.legacyCategory !== "Todos") {
            const query = applyListingTypeFilter(
                ctx.db
                    .query("products")
                    .withIndex("by_category_createdAt", (q) =>
                    q.eq("category", args.legacyCategory),
                    ),
                args.listingType,
            );

            return await query
                .order("desc")
                .paginate(args.paginationOpts);
        }

        const query = applyListingTypeFilter(
            ctx.db
                .query("products")
                .withIndex("by_createdAt"),
            args.listingType,
        );

        return await query
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

export const getShareById = query({
    args: {
        productId: v.id("products"),
    },
    returns: v.union(shareProductValidator, v.null()),
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) {
            return null;
        }

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", product.authorId))
            .first();

        const primaryImageId = product.mediaIds?.[0];
        const primaryImageUrl = primaryImageId ? await ctx.storage.getUrl(primaryImageId) ?? undefined : undefined;

        return {
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            type: product.type,
            category: product.category,
            familyId: product.familyId,
            categoryId: product.categoryId,
            location: product.location
                ? {
                    address: product.location.address,
                    label: product.location.label,
                }
                : undefined,
            createdAt: product.createdAt,
            primaryImageUrl,
            authorDisplayName: profile?.displayName,
        };
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
        familyId: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        attributes: attributesValidator,
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

        if (args.attributes !== undefined) {
            updates.attributes = normalizeAttributes(args.attributes);
        }

        if (args.familyId !== undefined || args.categoryId !== undefined || args.category !== undefined) {
            const { resolvedFamily, resolvedCategory } = resolveTaxonomyFilter(
                args.familyId ?? product.familyId,
                args.categoryId ?? product.categoryId,
            );

            updates.familyId = resolvedFamily;
            updates.categoryId = resolvedCategory;
            updates.category = getLegacyCategoryLabel(resolvedCategory, args.category ?? product.category);
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

        const resultingMediaIds = args.mediaIds ?? product.mediaIds ?? [];
        if (resultingMediaIds.length === 0) {
            throw new Error("Debes mantener al menos una foto de portada");
        }

        if (args.location !== undefined) {
            updates.location = args.location;
        }

        await ctx.db.patch(args.productId, updates);
    },
});
