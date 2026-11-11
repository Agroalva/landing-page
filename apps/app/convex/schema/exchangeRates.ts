import { defineTable } from "convex/server";
import { v } from "convex/values";

// Latest known exchange rate per currency pair (one row per pair), refreshed
// by a cron. Used to compare ARS and USD prices in search filters and sorting.
export const exchangeRatesTable = defineTable({
    pair: v.string(), // e.g. "USD_ARS"
    rate: v.number(), // Units of the quote currency per unit of the base (ARS per USD)
    source: v.string(), // e.g. "dolarapi:oficial"
    sourceUpdatedAt: v.optional(v.string()),
    fetchedAt: v.number(),
})
    .index("by_pair", ["pair"]);
