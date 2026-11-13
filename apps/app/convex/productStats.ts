import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";
import {
    productContactChannelValidator,
    productContactSourceValidator,
} from "./schema/productStats";

export type ProductContactChannel = "whatsapp" | "call" | "message";
export type ProductContactSource = "app" | "web";

// Repeated contacts from the same user, on the same product and channel,
// inside this window are counted once.
const CONTACT_DEDUP_WINDOW_MS = 30 * 60 * 1000;
const DEFAULT_HISTORY_DAYS = 30;
const MAX_HISTORY_DAYS = 90;
const MAX_LISTINGS_WITH_STATS = 100;
const CLEANUP_BATCH_SIZE = 200;

// Argentina has no DST: UTC-3 all year.
const ARGENTINA_UTC_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const toStatsDayKey = (timestamp: number) =>
    new Date(timestamp + ARGENTINA_UTC_OFFSET_MS).toISOString().slice(0, 10);

const buildDayKeys = (days: number, now: number) => {
    const keys: string[] = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
        keys.push(toStatsDayKey(now - offset * DAY_MS));
    }
    return keys;
};

const getOptionalUserId = async (ctx: QueryCtx | MutationCtx) => {
    try {
        const user = await authComponent.safeGetAuthUser(ctx);
        return user ? (user._id as string) : null;
    } catch {
        return null;
    }
};

const getDailyStatsDoc = async (
    ctx: MutationCtx,
    product: Doc<"products">,
    day: string,
) => {
    const existing = await ctx.db
        .query("productDailyStats")
        .withIndex("by_productId_day", (q) => q.eq("productId", product._id).eq("day", day))
        .unique();

    if (existing) {
        return existing;
    }

    const id = await ctx.db.insert("productDailyStats", {
        productId: product._id,
        authorId: product.authorId,
        day,
        views: 0,
        whatsapp: 0,
        calls: 0,
        messages: 0,
        updatedAt: Date.now(),
    });
    return (await ctx.db.get(id))!;
};

/**
 * Adds one view to today's bucket. The lifetime total keeps living in
 * `products.viewCount` for backwards compatibility with released clients.
 */
export async function recordDailyView(ctx: MutationCtx, product: Doc<"products">) {
    const now = Date.now();
    const daily = await getDailyStatsDoc(ctx, product, toStatsDayKey(now));
    await ctx.db.patch(daily._id, { views: daily.views + 1, updatedAt: now });
}

/**
 * Records a contact (WhatsApp, call or in-app message) for a product.
 * Returns false when the contact is not counted: the user is the author or
 * already contacted through the same channel recently.
 */
export async function recordProductContact(
    ctx: MutationCtx,
    product: Doc<"products">,
    userId: string,
    channel: ProductContactChannel,
    source?: ProductContactSource,
) {
    if (userId === product.authorId) {
        return false;
    }

    const now = Date.now();
    const recent = await ctx.db
        .query("productContactEvents")
        .withIndex("by_productId_userId_channel_createdAt", (q) =>
            q
                .eq("productId", product._id)
                .eq("userId", userId)
                .eq("channel", channel)
                .gte("createdAt", now - CONTACT_DEDUP_WINDOW_MS),
        )
        .first();
    if (recent) {
        return false;
    }

    await ctx.db.insert("productContactEvents", {
        productId: product._id,
        authorId: product.authorId,
        userId,
        channel,
        source,
        createdAt: now,
    });

    const isWhatsapp = channel === "whatsapp" ? 1 : 0;
    const isCall = channel === "call" ? 1 : 0;
    const isMessage = channel === "message" ? 1 : 0;

    const totals = await ctx.db
        .query("productStats")
        .withIndex("by_productId", (q) => q.eq("productId", product._id))
        .unique();
    if (totals) {
        await ctx.db.patch(totals._id, {
            whatsappCount: totals.whatsappCount + isWhatsapp,
            callCount: totals.callCount + isCall,
            messageCount: totals.messageCount + isMessage,
            lastContactAt: now,
            updatedAt: now,
        });
    } else {
        await ctx.db.insert("productStats", {
            productId: product._id,
            authorId: product.authorId,
            whatsappCount: isWhatsapp,
            callCount: isCall,
            messageCount: isMessage,
            lastContactAt: now,
            updatedAt: now,
        });
    }

    const daily = await getDailyStatsDoc(ctx, product, toStatsDayKey(now));
    await ctx.db.patch(daily._id, {
        whatsapp: daily.whatsapp + isWhatsapp,
        calls: daily.calls + isCall,
        messages: daily.messages + isMessage,
        updatedAt: now,
    });

    return true;
}

// Called by clients when the user taps WhatsApp / Llamar. In-app messages
// are recorded server-side by `conversations.ensureConversation`.
export const recordContact = mutation({
    args: {
        productId: v.id("products"),
        channel: productContactChannelValidator,
        source: v.optional(productContactSourceValidator),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const userId = await getOptionalUserId(ctx);
        if (!userId) {
            return false;
        }

        const product = await ctx.db.get(args.productId);
        if (!product) {
            return false;
        }

        return await recordProductContact(ctx, product, userId, args.channel, args.source);
    },
});

const contactTotalsValidator = v.object({
    whatsapp: v.number(),
    call: v.number(),
    message: v.number(),
    total: v.number(),
});

const listingStatsSummaryValidator = v.object({
    productId: v.id("products"),
    views: v.number(),
    favorites: v.number(),
    contacts: contactTotalsValidator,
});

const dailyPointValidator = v.object({
    day: v.string(),
    views: v.number(),
    favorites: v.number(),
    whatsapp: v.number(),
    call: v.number(),
    message: v.number(),
});

const productStatsDetailValidator = v.object({
    productId: v.id("products"),
    name: v.string(),
    createdAt: v.number(),
    totals: v.object({
        views: v.number(),
        favorites: v.number(),
        contacts: contactTotalsValidator,
    }),
    period: v.object({
        days: v.number(),
        views: v.number(),
        favorites: v.number(),
        contacts: contactTotalsValidator,
    }),
    daily: v.array(dailyPointValidator),
});

const buildContactTotals = (whatsapp: number, call: number, message: number) => ({
    whatsapp,
    call,
    message,
    total: whatsapp + call + message,
});

const getContactTotals = async (ctx: QueryCtx, productId: Id<"products">) => {
    const totals = await ctx.db
        .query("productStats")
        .withIndex("by_productId", (q) => q.eq("productId", productId))
        .unique();
    return buildContactTotals(
        totals?.whatsappCount ?? 0,
        totals?.callCount ?? 0,
        totals?.messageCount ?? 0,
    );
};

const getFavorites = async (ctx: QueryCtx, productId: Id<"products">) =>
    await ctx.db
        .query("favorites")
        .withIndex("by_productId", (q) => q.eq("productId", productId))
        .collect();

// Private: stats for every listing of the signed-in user ("Mis publicaciones").
export const getMyListingsStats = query({
    args: {},
    returns: v.array(listingStatsSummaryValidator),
    handler: async (ctx) => {
        const userId = await getOptionalUserId(ctx);
        if (!userId) {
            return [];
        }

        const products = await ctx.db
            .query("products")
            .withIndex("by_authorId", (q) => q.eq("authorId", userId))
            .order("desc")
            .take(MAX_LISTINGS_WITH_STATS);

        return await Promise.all(
            products.map(async (product) => ({
                productId: product._id,
                views: product.viewCount ?? 0,
                favorites: (await getFavorites(ctx, product._id)).length,
                contacts: await getContactTotals(ctx, product._id),
            })),
        );
    },
});

// Private: totals plus daily evolution for one listing. Returns null unless
// the signed-in user is the author.
export const getProductStats = query({
    args: {
        // Plain string so a malformed id in a URL returns null instead of throwing.
        productId: v.string(),
        days: v.optional(v.number()),
    },
    returns: v.union(productStatsDetailValidator, v.null()),
    handler: async (ctx, args) => {
        const userId = await getOptionalUserId(ctx);
        if (!userId) {
            return null;
        }

        const productId = ctx.db.normalizeId("products", args.productId);
        if (!productId) {
            return null;
        }

        const product = await ctx.db.get(productId);
        if (!product || product.authorId !== userId) {
            return null;
        }

        const days = Math.min(
            Math.max(Math.floor(args.days ?? DEFAULT_HISTORY_DAYS), 1),
            MAX_HISTORY_DAYS,
        );
        const dayKeys = buildDayKeys(days, Date.now());
        const firstDay = dayKeys[0];

        const dailyDocs = await ctx.db
            .query("productDailyStats")
            .withIndex("by_productId_day", (q) =>
                q.eq("productId", product._id).gte("day", firstDay),
            )
            .collect();
        const dailyByDay = new Map(dailyDocs.map((doc) => [doc.day, doc]));

        const favorites = await getFavorites(ctx, product._id);
        const favoritesByDay = new Map<string, number>();
        for (const favorite of favorites) {
            const day = toStatsDayKey(favorite.createdAt);
            if (day >= firstDay) {
                favoritesByDay.set(day, (favoritesByDay.get(day) ?? 0) + 1);
            }
        }

        const daily = dayKeys.map((day) => {
            const doc = dailyByDay.get(day);
            return {
                day,
                views: doc?.views ?? 0,
                favorites: favoritesByDay.get(day) ?? 0,
                whatsapp: doc?.whatsapp ?? 0,
                call: doc?.calls ?? 0,
                message: doc?.messages ?? 0,
            };
        });

        const sum = (key: "views" | "favorites" | "whatsapp" | "call" | "message") =>
            daily.reduce((total, point) => total + point[key], 0);

        return {
            productId: product._id,
            name: product.name,
            createdAt: product.createdAt,
            totals: {
                views: product.viewCount ?? 0,
                favorites: favorites.length,
                contacts: await getContactTotals(ctx, product._id),
            },
            period: {
                days,
                views: sum("views"),
                favorites: sum("favorites"),
                contacts: buildContactTotals(sum("whatsapp"), sum("call"), sum("message")),
            },
            daily,
        };
    },
});

// Removes stats rows for a deleted product, in batches.
export const deleteStatsForProduct = internalMutation({
    args: {
        productId: v.id("products"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const totals = await ctx.db
            .query("productStats")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .take(CLEANUP_BATCH_SIZE);
        const daily = await ctx.db
            .query("productDailyStats")
            .withIndex("by_productId_day", (q) => q.eq("productId", args.productId))
            .take(CLEANUP_BATCH_SIZE);
        const events = await ctx.db
            .query("productContactEvents")
            .withIndex("by_productId_createdAt", (q) => q.eq("productId", args.productId))
            .take(CLEANUP_BATCH_SIZE);

        for (const doc of [...totals, ...daily, ...events]) {
            await ctx.db.delete(doc._id);
        }

        if (
            totals.length === CLEANUP_BATCH_SIZE
            || daily.length === CLEANUP_BATCH_SIZE
            || events.length === CLEANUP_BATCH_SIZE
        ) {
            await ctx.scheduler.runAfter(0, internal.productStats.deleteStatsForProduct, {
                productId: args.productId,
            });
        }

        return null;
    },
});
