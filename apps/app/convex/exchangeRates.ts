import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { USD_ARS_PAIR } from "./lib/exchangeRate";

// Same provider the web market data uses (apps/web/lib/market-data.ts).
// We use the official (BNA) selling rate: it is the reference for machinery
// quoted in dollars and, with the current narrow gap between rates, the
// choice barely changes how listings compare.
const DOLLAR_API_URL = "https://dolarapi.com/v1/dolares/oficial";
const DOLLAR_SOURCE = "dolarapi:oficial";

type DollarApiRate = {
    casa?: string;
    venta?: number;
    fechaActualizacion?: string;
};

export const refreshUsdArs = internalAction({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        let data: DollarApiRate;
        try {
            const response = await fetch(DOLLAR_API_URL);
            if (!response.ok) {
                console.error(`DolarAPI returned ${response.status}`);
                return null;
            }
            data = (await response.json()) as DollarApiRate;
        } catch (error) {
            console.error("Could not fetch USD/ARS rate:", error);
            return null;
        }

        if (typeof data.venta !== "number" || !Number.isFinite(data.venta) || data.venta <= 0) {
            console.error("DolarAPI response has no valid selling rate");
            return null;
        }

        await ctx.runMutation(internal.exchangeRates.storeRate, {
            pair: USD_ARS_PAIR,
            rate: data.venta,
            source: DOLLAR_SOURCE,
            sourceUpdatedAt: data.fechaActualizacion,
        });
        return null;
    },
});

export const storeRate = internalMutation({
    args: {
        pair: v.string(),
        rate: v.number(),
        source: v.string(),
        sourceUpdatedAt: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("exchangeRates")
            .withIndex("by_pair", (q) => q.eq("pair", args.pair))
            .first();
        const row = {
            pair: args.pair,
            rate: args.rate,
            source: args.source,
            sourceUpdatedAt: args.sourceUpdatedAt,
            fetchedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.replace(existing._id, row);
        } else {
            await ctx.db.insert("exchangeRates", row);
        }
        return null;
    },
});
