import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { resolveTaxonomyFilter } from "./taxonomy";

const listingTypeValidator = v.union(v.literal("rent"), v.literal("sell"));
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

const publicLocationValidator = v.optional(v.object({
    address: v.optional(v.string()),
    label: v.optional(v.string()),
}));

const sellerSummaryValidator = v.object({
    userId: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
});

const listingCardValidator = v.object({
    _id: v.id("products"),
    authorId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: listingTypeValidator,
    category: v.optional(v.string()),
    familyId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    location: publicLocationValidator,
    primaryImageUrl: v.optional(v.string()),
    seller: sellerSummaryValidator,
    viewCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
});

const productDetailValidator = v.object({
    _id: v.id("products"),
    authorId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: listingTypeValidator,
    category: v.optional(v.string()),
    familyId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), attributeValueValidator)),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    location: publicLocationValidator,
    imageUrls: v.array(v.string()),
    mediaIds: v.array(v.id("_storage")),
    seller: sellerSummaryValidator,
    viewCount: v.number(),
    isOwner: v.boolean(),
    isFavorite: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
});

const profileValidator = v.object({
    userId: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    listings: v.array(listingCardValidator),
});

async function getSellerSummary(ctx: any, userId: string) {
    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .first();
    const avatarUrl = profile?.avatarId
        ? await ctx.storage.getUrl(profile.avatarId) ?? undefined
        : undefined;

    return {
        userId,
        displayName: profile?.displayName || "Usuario de Agroalva",
        bio: profile?.bio,
        avatarUrl,
    };
}

async function toListingCard(ctx: any, product: Doc<"products">) {
    const primaryImageId = product.mediaIds?.[0];
    const primaryImageUrl = primaryImageId
        ? await ctx.storage.getUrl(primaryImageId) ?? undefined
        : undefined;

    return {
        _id: product._id,
        authorId: product.authorId,
        name: product.name,
        description: product.description,
        type: product.type,
        category: product.category,
        familyId: product.familyId,
        categoryId: product.categoryId,
        price: product.price,
        currency: product.currency,
        location: product.location
            ? { address: product.location.address, label: product.location.label }
            : undefined,
        primaryImageUrl,
        seller: await getSellerSummary(ctx, product.authorId),
        viewCount: product.viewCount || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

function applyListingTypeFilter(queryBuilder: any, listingType?: "rent" | "sell") {
    return listingType
        ? queryBuilder.filter((q: any) => q.eq(q.field("type"), listingType))
        : queryBuilder;
}

export const list = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
        familyId: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        listingType: v.optional(listingTypeValidator),
    },
    returns: v.object({
        page: v.array(listingCardValidator),
        isDone: v.boolean(),
        continueCursor: v.string(),
    }),
    handler: async (ctx, args) => {
        const searchTerm = args.search?.trim();
        const { resolvedFamily, resolvedCategory } = resolveTaxonomyFilter(
            args.familyId,
            args.categoryId,
        );
        let result;

        if (searchTerm && searchTerm.length >= 2) {
            const searchQuery = ctx.db
                .query("products")
                .withSearchIndex("search_name", (q) => {
                    let builder = q.search("name", searchTerm);
                    if (resolvedFamily) {
                        builder = builder.eq("familyId", resolvedFamily);
                    }
                    if (resolvedCategory) {
                        builder = builder.eq("categoryId", resolvedCategory);
                    }
                    if (args.listingType) {
                        builder = builder.eq("type", args.listingType);
                    }
                    return builder;
                });
            result = await searchQuery.paginate(args.paginationOpts);
        } else if (resolvedCategory && resolvedFamily) {
            const products = applyListingTypeFilter(
                ctx.db
                    .query("products")
                    .withIndex("by_family_category", (q) =>
                        q.eq("familyId", resolvedFamily).eq("categoryId", resolvedCategory),
                    ),
                args.listingType,
            );
            result = await products.order("desc").paginate(args.paginationOpts);
        } else if (resolvedFamily) {
            const products = applyListingTypeFilter(
                ctx.db
                    .query("products")
                    .withIndex("by_family", (q) => q.eq("familyId", resolvedFamily)),
                args.listingType,
            );
            result = await products.order("desc").paginate(args.paginationOpts);
        } else if (args.listingType) {
            result = await ctx.db
                .query("products")
                .withIndex("by_type", (q) => q.eq("type", args.listingType!))
                .order("desc")
                .paginate(args.paginationOpts);
        } else {
            result = await ctx.db
                .query("products")
                .withIndex("by_createdAt")
                .order("desc")
                .paginate(args.paginationOpts);
        }

        return {
            page: await Promise.all(result.page.map((product: Doc<"products">) => toListingCard(ctx, product))),
            isDone: result.isDone,
            continueCursor: result.continueCursor,
        };
    },
});

export const getProduct = query({
    args: { productId: v.id("products") },
    returns: v.union(productDetailValidator, v.null()),
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) {
            return null;
        }

        let userId: string | null = null;
        try {
            const user = await authComponent.getAuthUser(ctx);
            userId = user?._id as string | null;
        } catch {
            userId = null;
        }

        const favorite = userId
            ? await ctx.db
                .query("favorites")
                .withIndex("by_userId_productId", (q) =>
                    q.eq("userId", userId!).eq("productId", product._id),
                )
                .first()
            : null;
        const imageUrls = (await Promise.all(
            (product.mediaIds || []).map((mediaId) => ctx.storage.getUrl(mediaId)),
        )).filter((url): url is string => Boolean(url));

        return {
            _id: product._id,
            authorId: product.authorId,
            name: product.name,
            description: product.description,
            type: product.type,
            category: product.category,
            familyId: product.familyId,
            categoryId: product.categoryId,
            attributes: product.attributes,
            price: product.price,
            currency: product.currency,
            location: product.location
                ? { address: product.location.address, label: product.location.label }
                : undefined,
            imageUrls,
            mediaIds: product.mediaIds || [],
            seller: await getSellerSummary(ctx, product.authorId),
            viewCount: product.viewCount || 0,
            isOwner: userId === product.authorId,
            isFavorite: Boolean(favorite),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    },
});

export const getPublicProfile = query({
    args: { userId: v.string() },
    returns: v.union(profileValidator, v.null()),
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (!profile) {
            return null;
        }

        const products = await ctx.db
            .query("products")
            .withIndex("by_authorId", (q) => q.eq("authorId", args.userId))
            .order("desc")
            .take(50);
        const avatarUrl = profile.avatarId
            ? await ctx.storage.getUrl(profile.avatarId) ?? undefined
            : undefined;

        return {
            userId: profile.userId,
            displayName: profile.displayName,
            bio: profile.bio,
            avatarUrl,
            createdAt: profile.createdAt,
            listings: await Promise.all(products.map((product) => toListingCard(ctx, product))),
        };
    },
});

export const myListings = query({
    args: {},
    returns: v.array(listingCardValidator),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }
        const products = await ctx.db
            .query("products")
            .withIndex("by_authorId", (q) => q.eq("authorId", user._id as string))
            .order("desc")
            .take(100);
        return await Promise.all(products.map((product) => toListingCard(ctx, product)));
    },
});

export const favoriteListings = query({
    args: {},
    returns: v.array(listingCardValidator),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }
        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
            .order("desc")
            .take(100);
        const products = (await Promise.all(
            favorites.map((favorite) => ctx.db.get(favorite.productId)),
        )).filter((product): product is Doc<"products"> => Boolean(product));
        return await Promise.all(products.map((product) => toListingCard(ctx, product)));
    },
});

const conversationSummaryValidator = v.object({
    _id: v.id("conversations"),
    otherUserId: v.string(),
    otherDisplayName: v.string(),
    otherAvatarUrl: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessageText: v.optional(v.string()),
    createdAt: v.number(),
    unreadCount: v.number(),
});

export const conversations = query({
    args: {},
    returns: v.array(conversationSummaryValidator),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }
        const userId = user._id as string;
        const all = await ctx.db.query("conversations").collect();
        const mine = all.filter((conversation) => conversation.memberIds.includes(userId));

        const summaries = await Promise.all(mine.map(async (conversation) => {
            const otherUserId = conversation.memberIds.find((id) => id !== userId) || userId;
            const seller = await getSellerSummary(ctx, otherUserId);
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                .collect();
            const unreadCount = messages.filter((message) =>
                message.senderId !== userId && !(message.readBy || []).includes(userId),
            ).length;

            return {
                _id: conversation._id,
                otherUserId,
                otherDisplayName: seller.displayName,
                otherAvatarUrl: seller.avatarUrl,
                lastMessageAt: conversation.lastMessageAt,
                lastMessageText: conversation.lastMessageText,
                createdAt: conversation.createdAt,
                unreadCount,
            };
        }));

        return summaries.sort((a, b) =>
            (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt),
        );
    },
});
