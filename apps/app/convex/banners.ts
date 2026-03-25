import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, validateExternalUrl } from "./lib/admin";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const bannerDocumentValidator = v.object({
    _id: v.id("banners"),
    _creationTime: v.number(),
    imageStorageId: v.id("_storage"),
    imageUrl: v.union(v.string(), v.null()),
    targetUrl: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdByUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
});

const publicBannerValidator = v.object({
    _id: v.id("banners"),
    imageUrl: v.string(),
    targetUrl: v.optional(v.string()),
    sortOrder: v.number(),
});

async function toBannerWithUrl(ctx: QueryCtx, banner: Doc<"banners">) {
    const imageUrl = await ctx.storage.getUrl(banner.imageStorageId);

    return {
        ...banner,
        imageUrl,
    };
}

export const listActive = query({
    args: {},
    returns: v.array(publicBannerValidator),
    handler: async (ctx) => {
        const banners = await ctx.db
            .query("banners")
            .withIndex("by_isActive_sortOrder", (q) => q.eq("isActive", true))
            .order("asc")
            .collect();

        const bannersWithUrls = await Promise.all(
            banners.map(async (banner) => toBannerWithUrl(ctx, banner))
        );

        return bannersWithUrls
            .filter((banner) => banner.imageUrl)
            .map((banner) => ({
                _id: banner._id,
                imageUrl: banner.imageUrl as string,
                targetUrl: banner.targetUrl,
                sortOrder: banner.sortOrder,
            }));
    },
});

export const listAdmin = query({
    args: {},
    returns: v.array(bannerDocumentValidator),
    handler: async (ctx) => {
        await requireAdmin(ctx);

        const banners = await ctx.db
            .query("banners")
            .withIndex("by_sortOrder")
            .order("asc")
            .collect();

        return await Promise.all(
            banners.map(async (banner) => toBannerWithUrl(ctx, banner))
        );
    },
});

export const generateBannerUploadUrl = mutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

export const createBanner = mutation({
    args: {
        imageStorageId: v.id("_storage"),
        targetUrl: v.optional(v.string()),
    },
    returns: v.id("banners"),
    handler: async (ctx, args) => {
        const { user } = await requireAdmin(ctx);

        validateExternalUrl(args.targetUrl);

        const existingBanners = await ctx.db
            .query("banners")
            .withIndex("by_sortOrder")
            .order("desc")
            .take(1);

        const nextSortOrder = existingBanners[0]?.sortOrder !== undefined
            ? existingBanners[0].sortOrder + 1
            : 0;

        return await ctx.db.insert("banners", {
            imageStorageId: args.imageStorageId,
            targetUrl: args.targetUrl,
            sortOrder: nextSortOrder,
            isActive: true,
            createdByUserId: user._id as string,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateBanner = mutation({
    args: {
        bannerId: v.id("banners"),
        imageStorageId: v.optional(v.id("_storage")),
        targetUrl: v.optional(v.union(v.string(), v.null())),
        isActive: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const banner = await ctx.db.get(args.bannerId);
        if (!banner) {
            throw new ConvexError("Banner not found");
        }

        validateExternalUrl(args.targetUrl);

        const patch: {
            imageStorageId?: Doc<"banners">["imageStorageId"];
            targetUrl?: string;
            isActive?: boolean;
            updatedAt: number;
        } = {
            updatedAt: Date.now(),
        };

        if (args.imageStorageId !== undefined) {
            patch.imageStorageId = args.imageStorageId;
        }

        if (Object.prototype.hasOwnProperty.call(args, "targetUrl")) {
            patch.targetUrl = args.targetUrl ?? undefined;
        }

        if (args.isActive !== undefined) {
            patch.isActive = args.isActive;
        }

        await ctx.db.patch(args.bannerId, patch);

        if (args.imageStorageId !== undefined && args.imageStorageId !== banner.imageStorageId) {
            await ctx.storage.delete(banner.imageStorageId);
        }

        return null;
    },
});

export const reorderBanners = mutation({
    args: {
        orderedBannerIds: v.array(v.id("banners")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const existingBanners = await ctx.db
            .query("banners")
            .withIndex("by_sortOrder")
            .order("asc")
            .collect();

        if (existingBanners.length !== args.orderedBannerIds.length) {
            throw new ConvexError("Banner reorder payload is incomplete");
        }

        const existingBannerIds = new Set(existingBanners.map((banner) => banner._id));
        for (const bannerId of args.orderedBannerIds) {
            if (!existingBannerIds.has(bannerId)) {
                throw new ConvexError("Banner reorder payload is invalid");
            }
        }

        for (let index = 0; index < args.orderedBannerIds.length; index += 1) {
            const bannerId = args.orderedBannerIds[index];
            const banner = await ctx.db.get(bannerId);

            if (!banner) {
                throw new ConvexError("Banner not found");
            }

            await ctx.db.patch(bannerId, {
                sortOrder: index,
                updatedAt: Date.now(),
            });
        }

        return null;
    },
});

export const deleteBanner = mutation({
    args: {
        bannerId: v.id("banners"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const banner = await ctx.db.get(args.bannerId);
        if (!banner) {
            throw new ConvexError("Banner not found");
        }

        await ctx.db.delete(args.bannerId);
        await ctx.storage.delete(banner.imageStorageId);

        const remainingBanners = await ctx.db
            .query("banners")
            .withIndex("by_sortOrder")
            .order("asc")
            .collect();

        for (let index = 0; index < remainingBanners.length; index += 1) {
            await ctx.db.patch(remainingBanners[index]._id, {
                sortOrder: index,
                updatedAt: Date.now(),
            });
        }

        return null;
    },
});
