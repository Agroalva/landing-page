import { v } from "convex/values";
import type { Infer } from "convex/values";

// Validators only (no function or schema imports) so the schema can use them
// without creating an import cycle.

export const listingTypeValidator = v.union(v.literal("rent"), v.literal("sell"));
export const priceCurrencyValidator = v.union(v.literal("ARS"), v.literal("USD"));
export const listingSortValidator = v.union(
    v.literal("recent"),
    v.literal("price_asc"),
    v.literal("price_desc"),
);

export const listingFilterFields = {
    query: v.optional(v.string()),
    familyId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    listingType: v.optional(listingTypeValidator),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    // Currency the price range is expressed in. Defaults to USD.
    priceCurrency: v.optional(priceCurrencyValidator),
    minYear: v.optional(v.number()),
    maxYear: v.optional(v.number()),
};

export const listingFiltersValidator = v.object(listingFilterFields);

export type ListingFilters = Infer<typeof listingFiltersValidator>;
export type ListingSort = Infer<typeof listingSortValidator>;
export type PriceCurrency = Infer<typeof priceCurrencyValidator>;
