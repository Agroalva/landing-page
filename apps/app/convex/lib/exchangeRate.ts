import type { QueryCtx } from "../_generated/server";

export const USD_ARS_PAIR = "USD_ARS";

export type UsdArsRate = {
    usdArs: number;
    source: string;
    updatedAt: number;
};

export async function loadUsdArsRate(ctx: QueryCtx): Promise<UsdArsRate | null> {
    const row = await ctx.db
        .query("exchangeRates")
        .withIndex("by_pair", (q) => q.eq("pair", USD_ARS_PAIR))
        .first();

    if (!row || !Number.isFinite(row.rate) || row.rate <= 0) {
        return null;
    }

    return {
        usdArs: row.rate,
        source: row.source,
        updatedAt: row.fetchedAt,
    };
}
