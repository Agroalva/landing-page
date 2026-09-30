import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { requireAdmin } from "./lib/admin";

const reviewStatusValidator = v.union(
    v.literal("published"),
    v.literal("hidden"),
    v.literal("deleted"),
);

const reviewValidator = v.object({
    _id: v.id("reviews"),
    _creationTime: v.number(),
    reviewerId: v.string(),
    reviewedUserId: v.string(),
    conversationId: v.id("conversations"),
    productId: v.optional(v.id("products")),
    productName: v.optional(v.string()),
    rating: v.number(),
    comment: v.string(),
    status: reviewStatusValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
});

const publicReviewValidator = v.object({
    _id: v.id("reviews"),
    reviewer: v.object({
        userId: v.string(),
        displayName: v.string(),
        avatarId: v.optional(v.id("_storage")),
    }),
    productName: v.optional(v.string()),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
});

const eligibleProductValidator = v.object({
    productId: v.id("products"),
    name: v.string(),
});

const reportReasonValidator = v.union(
    v.literal("spam"),
    v.literal("harassment"),
    v.literal("inappropriate"),
    v.literal("false_information"),
    v.literal("other"),
);

function validateReviewInput(rating: number, comment: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new ConvexError("La calificación debe ser un número entero entre 1 y 5");
    }

    const normalizedComment = comment.trim();
    if (normalizedComment.length < 10) {
        throw new ConvexError("El comentario debe tener al menos 10 caracteres");
    }
    if (normalizedComment.length > 1000) {
        throw new ConvexError("El comentario no puede superar los 1000 caracteres");
    }

    return normalizedComment;
}

async function getConversation(ctx: any, firstUserId: string, secondUserId: string) {
    const memberIds = [firstUserId, secondUserId].sort();
    return await ctx.db
        .query("conversations")
        .withIndex("by_memberIds", (q: any) => q.eq("memberIds", memberIds))
        .first();
}

async function hasMutualMessages(
    ctx: any,
    conversationId: Id<"conversations">,
    firstUserId: string,
    secondUserId: string,
) {
    const [firstMessage, secondMessage] = await Promise.all([
        ctx.db
            .query("messages")
            .withIndex("by_conversationId_senderId", (q: any) =>
                q.eq("conversationId", conversationId).eq("senderId", firstUserId),
            )
            .first(),
        ctx.db
            .query("messages")
            .withIndex("by_conversationId_senderId", (q: any) =>
                q.eq("conversationId", conversationId).eq("senderId", secondUserId),
            )
            .first(),
    ]);

    return Boolean(firstMessage && secondMessage);
}

async function adjustProfileRating(
    ctx: any,
    userId: string,
    ratingSumDelta: number,
    ratingCountDelta: number,
) {
    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .first();

    if (!profile) {
        throw new ConvexError("No se encontró el perfil que deseas calificar");
    }

    await ctx.db.patch(profile._id, {
        ratingSum: Math.max(0, (profile.ratingSum || 0) + ratingSumDelta),
        ratingCount: Math.max(0, (profile.ratingCount || 0) + ratingCountDelta),
        updatedAt: Date.now(),
    });
}

async function resolveEligibleProduct(
    ctx: any,
    conversation: any,
    reviewedUserId: string,
    productId?: Id<"products">,
) {
    if (!productId) {
        return undefined;
    }

    if (!conversation.productIds?.includes(productId)) {
        throw new ConvexError("Esta publicación no pertenece a la conversación");
    }

    const product = await ctx.db.get(productId);
    if (!product || product.authorId !== reviewedUserId) {
        throw new ConvexError("La publicación no pertenece al usuario calificado");
    }

    return product;
}

export const listForUser = query({
    args: {
        reviewedUserId: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    returns: v.object({
        page: v.array(publicReviewValidator),
        isDone: v.boolean(),
        continueCursor: v.string(),
    }),
    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("reviews")
            .withIndex("by_reviewedUserId_status_createdAt", (q) =>
                q
                    .eq("reviewedUserId", args.reviewedUserId)
                    .eq("status", "published"),
            )
            .order("desc")
            .paginate(args.paginationOpts);

        const page = await Promise.all(result.page.map(async (review) => {
            const reviewerProfile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", review.reviewerId))
                .first();

            return {
                _id: review._id,
                reviewer: {
                    userId: review.reviewerId,
                    displayName: reviewerProfile?.displayName || "Usuario de Agroalva",
                    avatarId: reviewerProfile?.avatarId,
                },
                productName: review.productName,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            };
        }));

        return {
            page,
            isDone: result.isDone,
            continueCursor: result.continueCursor,
        };
    },
});

export const getSummaryForUser = query({
    args: { userId: v.string() },
    returns: v.object({
        average: v.union(v.number(), v.null()),
        count: v.number(),
    }),
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        const count = profile?.ratingCount || 0;

        return {
            average: count > 0 ? (profile?.ratingSum || 0) / count : null,
            count,
        };
    },
});

export const getMyReviewForUser = query({
    args: { reviewedUserId: v.string() },
    returns: v.union(reviewValidator, v.null()),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return null;
        }

        const review = await ctx.db
            .query("reviews")
            .withIndex("by_reviewerId_reviewedUserId", (q) =>
                q
                    .eq("reviewerId", user._id as string)
                    .eq("reviewedUserId", args.reviewedUserId),
            )
            .first();

        return review?.status === "published" ? review : null;
    },
});

export const getReviewEligibility = query({
    args: { reviewedUserId: v.string() },
    returns: v.object({
        canReview: v.boolean(),
        reason: v.string(),
        conversationId: v.optional(v.id("conversations")),
        products: v.array(eligibleProductValidator),
    }),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return { canReview: false, reason: "not_authenticated", products: [] };
        }

        const reviewerId = user._id as string;
        if (reviewerId === args.reviewedUserId) {
            return { canReview: false, reason: "self_review", products: [] };
        }

        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_reviewerId_reviewedUserId", (q) =>
                q.eq("reviewerId", reviewerId).eq("reviewedUserId", args.reviewedUserId),
            )
            .first();
        if (existingReview && existingReview.status !== "deleted") {
            return { canReview: false, reason: "already_reviewed", products: [] };
        }

        const conversation = await getConversation(ctx, reviewerId, args.reviewedUserId);
        if (!conversation) {
            return { canReview: false, reason: "no_conversation", products: [] };
        }

        const mutualMessages = await hasMutualMessages(
            ctx,
            conversation._id,
            reviewerId,
            args.reviewedUserId,
        );
        if (!mutualMessages) {
            return {
                canReview: false,
                reason: "no_mutual_messages",
                conversationId: conversation._id,
                products: [],
            };
        }

        const products = (await Promise.all(
            (conversation.productIds || []).map(async (productId: Id<"products">) => {
                const product = await ctx.db.get(productId);
                if (!product || product.authorId !== args.reviewedUserId) {
                    return null;
                }
                return { productId: product._id, name: product.name };
            }),
        )).filter((product: any): product is { productId: Id<"products">; name: string } =>
            Boolean(product),
        );

        return {
            canReview: true,
            reason: "eligible",
            conversationId: conversation._id,
            products,
        };
    },
});

export const create = mutation({
    args: {
        reviewedUserId: v.string(),
        rating: v.number(),
        comment: v.string(),
        productId: v.optional(v.id("products")),
    },
    returns: v.id("reviews"),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError("Debes iniciar sesión para publicar una reseña");
        }

        const reviewerId = user._id as string;
        if (reviewerId === args.reviewedUserId) {
            throw new ConvexError("No puedes calificarte a ti mismo");
        }
        const comment = validateReviewInput(args.rating, args.comment);

        const conversation = await getConversation(ctx, reviewerId, args.reviewedUserId);
        if (!conversation || !await hasMutualMessages(
            ctx,
            conversation._id,
            reviewerId,
            args.reviewedUserId,
        )) {
            throw new ConvexError("Ambos usuarios deben haber participado en la conversación");
        }

        const product = await resolveEligibleProduct(
            ctx,
            conversation,
            args.reviewedUserId,
            args.productId,
        );
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_reviewerId_reviewedUserId", (q) =>
                q.eq("reviewerId", reviewerId).eq("reviewedUserId", args.reviewedUserId),
            )
            .first();
        if (existingReview && existingReview.status !== "deleted") {
            throw new ConvexError("Ya publicaste una reseña para este usuario");
        }

        const now = Date.now();
        let reviewId: Id<"reviews">;
        if (existingReview) {
            await ctx.db.patch(existingReview._id, {
                conversationId: conversation._id,
                productId: product?._id,
                productName: product?.name,
                rating: args.rating,
                comment,
                status: "published",
                createdAt: now,
                updatedAt: now,
            });
            reviewId = existingReview._id;
        } else {
            reviewId = await ctx.db.insert("reviews", {
                reviewerId,
                reviewedUserId: args.reviewedUserId,
                conversationId: conversation._id,
                productId: product?._id,
                productName: product?.name,
                rating: args.rating,
                comment,
                status: "published",
                createdAt: now,
                updatedAt: now,
            });
        }

        await adjustProfileRating(ctx, args.reviewedUserId, args.rating, 1);
        await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
            userId: args.reviewedUserId,
            type: "review",
            title: "Nueva reseña",
            body: `Recibiste una calificación de ${args.rating} estrellas`,
            relatedId: args.reviewedUserId,
        });

        return reviewId;
    },
});

export const update = mutation({
    args: {
        reviewId: v.id("reviews"),
        rating: v.number(),
        comment: v.string(),
        productId: v.optional(v.id("products")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError("Debes iniciar sesión");
        }
        const review = await ctx.db.get(args.reviewId);
        if (!review || review.status !== "published") {
            throw new ConvexError("No se encontró la reseña");
        }
        if (review.reviewerId !== (user._id as string)) {
            throw new ConvexError("No puedes editar esta reseña");
        }

        const comment = validateReviewInput(args.rating, args.comment);
        const conversation = await ctx.db.get(review.conversationId);
        if (!conversation) {
            throw new ConvexError("No se encontró la conversación asociada");
        }
        const keepsExistingProduct = Boolean(
            args.productId && args.productId === review.productId,
        );
        const product = keepsExistingProduct
            ? undefined
            : await resolveEligibleProduct(
                ctx,
                conversation,
                review.reviewedUserId,
                args.productId,
            );

        await ctx.db.patch(review._id, {
            productId: keepsExistingProduct ? review.productId : product?._id,
            productName: keepsExistingProduct ? review.productName : product?.name,
            rating: args.rating,
            comment,
            updatedAt: Date.now(),
        });
        await adjustProfileRating(
            ctx,
            review.reviewedUserId,
            args.rating - review.rating,
            0,
        );

        return null;
    },
});

export const remove = mutation({
    args: { reviewId: v.id("reviews") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError("Debes iniciar sesión");
        }
        const review = await ctx.db.get(args.reviewId);
        if (!review || review.status === "deleted") {
            return null;
        }
        if (review.reviewerId !== (user._id as string)) {
            throw new ConvexError("No puedes eliminar esta reseña");
        }

        if (review.status === "published") {
            await adjustProfileRating(ctx, review.reviewedUserId, -review.rating, -1);
        }
        await ctx.db.patch(review._id, {
            status: "deleted",
            updatedAt: Date.now(),
        });

        const reports = await ctx.db
            .query("reviewReports")
            .withIndex("by_reviewId", (q) => q.eq("reviewId", review._id))
            .collect();
        for (const report of reports) {
            await ctx.db.delete(report._id);
        }

        return null;
    },
});

export const report = mutation({
    args: {
        reviewId: v.id("reviews"),
        reason: reportReasonValidator,
        details: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError("Debes iniciar sesión");
        }
        const review = await ctx.db.get(args.reviewId);
        if (!review || review.status !== "published") {
            throw new ConvexError("No se encontró la reseña");
        }
        const reportedBy = user._id as string;
        if (review.reviewerId === reportedBy) {
            throw new ConvexError("No puedes reportar tu propia reseña");
        }

        const details = args.details?.trim();
        if (details && details.length > 500) {
            throw new ConvexError("El detalle no puede superar los 500 caracteres");
        }
        const existingReport = await ctx.db
            .query("reviewReports")
            .withIndex("by_reviewId_reportedBy", (q) =>
                q.eq("reviewId", args.reviewId).eq("reportedBy", reportedBy),
            )
            .first();
        if (existingReport) {
            return null;
        }

        const now = Date.now();
        await ctx.db.insert("reviewReports", {
            reviewId: args.reviewId,
            reportedBy,
            reason: args.reason,
            details: details || undefined,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        });

        return null;
    },
});

export const listPendingReports = query({
    args: { limit: v.optional(v.number()) },
    returns: v.array(v.object({
        _id: v.id("reviewReports"),
        reviewId: v.id("reviews"),
        reportedBy: v.string(),
        reason: reportReasonValidator,
        details: v.optional(v.string()),
        createdAt: v.number(),
        review: v.union(v.object({
            reviewerId: v.string(),
            reviewedUserId: v.string(),
            rating: v.number(),
            comment: v.string(),
            status: reviewStatusValidator,
        }), v.null()),
    })),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const reports = await ctx.db
            .query("reviewReports")
            .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
            .order("asc")
            .take(Math.min(Math.max(args.limit || 50, 1), 100));

        return await Promise.all(reports.map(async (report) => {
            const review = await ctx.db.get(report.reviewId);
            return {
                _id: report._id,
                reviewId: report.reviewId,
                reportedBy: report.reportedBy,
                reason: report.reason,
                details: report.details,
                createdAt: report.createdAt,
                review: review ? {
                    reviewerId: review.reviewerId,
                    reviewedUserId: review.reviewedUserId,
                    rating: review.rating,
                    comment: review.comment,
                    status: review.status,
                } : null,
            };
        }));
    },
});

export const resolveReport = mutation({
    args: {
        reportId: v.id("reviewReports"),
        status: v.union(v.literal("reviewed"), v.literal("dismissed")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const report = await ctx.db.get(args.reportId);
        if (!report) {
            return null;
        }

        await ctx.db.patch(report._id, {
            status: args.status,
            updatedAt: Date.now(),
        });
        return null;
    },
});

export const setVisibility = mutation({
    args: {
        reviewId: v.id("reviews"),
        status: v.union(v.literal("published"), v.literal("hidden")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const review = await ctx.db.get(args.reviewId);
        if (!review || review.status === "deleted" || review.status === args.status) {
            return null;
        }

        if (args.status === "hidden") {
            await adjustProfileRating(ctx, review.reviewedUserId, -review.rating, -1);
        } else {
            await adjustProfileRating(ctx, review.reviewedUserId, review.rating, 1);
        }
        await ctx.db.patch(review._id, {
            status: args.status,
            updatedAt: Date.now(),
        });

        return null;
    },
});

export const rebuildUserRating = internalMutation({
    args: { userId: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (!profile) {
            return null;
        }

        const publishedReviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewedUserId_status_createdAt", (q) =>
                q.eq("reviewedUserId", args.userId).eq("status", "published"),
            )
            .collect();
        await ctx.db.patch(profile._id, {
            ratingSum: publishedReviews.reduce((sum, review) => sum + review.rating, 0),
            ratingCount: publishedReviews.length,
            updatedAt: Date.now(),
        });

        return null;
    },
});
