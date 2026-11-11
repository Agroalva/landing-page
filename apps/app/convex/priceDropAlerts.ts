import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const FAVORITES_BATCH_SIZE = 100;

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "US$",
    ARS: "AR$",
};

// Mirrors utils/currency.ts in the app, with Argentine thousands separators.
const formatPrice = (price: number, currency: string) =>
    `${CURRENCY_SYMBOLS[currency] ?? "$"}${Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

export function isPriceDrop(args: {
    previousPrice?: number;
    previousCurrency?: string;
    nextPrice?: number;
    nextCurrency?: string;
}) {
    const { previousPrice, previousCurrency, nextPrice, nextCurrency } = args;
    return (
        typeof previousPrice === "number" &&
        typeof nextPrice === "number" &&
        Number.isFinite(previousPrice) &&
        Number.isFinite(nextPrice) &&
        previousPrice > 0 &&
        nextPrice > 0 &&
        nextPrice < previousPrice &&
        // A currency switch is not a comparable drop.
        Boolean(nextCurrency) &&
        nextCurrency === previousCurrency
    );
}

/**
 * Scheduled from products.update when the author lowers the price. The first
 * run checks the announced-price baseline; later runs only page through the
 * favorites.
 */
export const notifyFavoriters = internalMutation({
    args: {
        productId: v.id("products"),
        previousPrice: v.number(),
        newPrice: v.number(),
        currency: v.string(),
        cursor: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) {
            return null;
        }

        if (args.cursor === undefined) {
            const baseline = await ctx.db
                .query("priceDropAlerts")
                .withIndex("by_productId", (q) => q.eq("productId", args.productId))
                .first();
            const now = Date.now();

            if (baseline && baseline.currency === args.currency) {
                if (args.newPrice >= baseline.lowestNotifiedPrice) {
                    return null;
                }
                await ctx.db.patch(baseline._id, {
                    lowestNotifiedPrice: args.newPrice,
                    lastNotifiedAt: now,
                });
            } else if (baseline) {
                await ctx.db.replace(baseline._id, {
                    productId: args.productId,
                    currency: args.currency,
                    lowestNotifiedPrice: args.newPrice,
                    lastNotifiedAt: now,
                });
            } else {
                await ctx.db.insert("priceDropAlerts", {
                    productId: args.productId,
                    currency: args.currency,
                    lowestNotifiedPrice: args.newPrice,
                    lastNotifiedAt: now,
                });
            }
        }

        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .paginate({ numItems: FAVORITES_BATCH_SIZE, cursor: args.cursor ?? null });

        const percent = Math.round((1 - args.newPrice / args.previousPrice) * 100);
        const body = `${product.name}: de ${formatPrice(args.previousPrice, args.currency)} a ${formatPrice(args.newPrice, args.currency)}${percent >= 1 ? ` (-${percent}%)` : ""}`;
        const notifiedUsers = new Set<string>();

        for (const favorite of favorites.page) {
            if (favorite.userId === product.authorId || notifiedUsers.has(favorite.userId)) {
                continue;
            }
            notifiedUsers.add(favorite.userId);
            await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
                userId: favorite.userId,
                type: "price_drop",
                title: "Bajó de precio un favorito",
                body,
                relatedId: args.productId,
            });
        }

        if (!favorites.isDone) {
            await ctx.scheduler.runAfter(0, internal.priceDropAlerts.notifyFavoriters, {
                ...args,
                cursor: favorites.continueCursor,
            });
        }

        return null;
    },
});
