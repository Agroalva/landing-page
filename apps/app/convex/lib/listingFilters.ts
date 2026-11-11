import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getCategoryById } from "../../config/taxonomy";
import type { CategoryId, FamilyId } from "../../config/taxonomy";
import { normalizeProductSearchTerm } from "../productSearch";
import { resolveTaxonomyFilter, shouldExcludePersonalListings } from "../taxonomy";
import type { UsdArsRate } from "./exchangeRate";
import type { ListingFilters, ListingSort, PriceCurrency } from "./listingFilterValidators";

export {
    listingFilterFields,
    listingFiltersValidator,
    listingSortValidator,
    listingTypeValidator,
    priceCurrencyValidator,
} from "./listingFilterValidators";
export type { ListingFilters, ListingSort, PriceCurrency } from "./listingFilterValidators";

/**
 * Shared listing filters. The same matcher decides what the search screen
 * shows and which new listings trigger saved-search alerts, so both always
 * agree on what "matches" means.
 */

export type NormalizedListingFilters = {
    tokens: string[];
    familyId?: FamilyId;
    categoryId?: CategoryId;
    listingType?: "rent" | "sell";
    excludePersonal: boolean;
    priceCurrency: PriceCurrency;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
};

const PERSONAL_FAMILY_ID = "personal";
const MIN_TOKEN_LENGTH = 3;
// Short connectors ("de", "en", "y") are already dropped by the length check.
const STOP_WORDS = new Set(["con", "para", "por", "los", "las", "del", "una", "uno"]);

export function tokenizeSearchQuery(query?: string) {
    if (!query) {
        return [];
    }

    const normalized = normalizeProductSearchTerm(query);
    const tokens = normalized
        .split(" ")
        .filter((token) => token.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(token));

    if (tokens.length === 0 && normalized) {
        // e.g. "JD 6": every word is short, so match the whole phrase instead
        // of silently dropping the text filter.
        return [normalized];
    }

    return [...new Set(tokens)];
}

const finiteOrUndefined = (value?: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

const orderedRange = (min?: number, max?: number) => {
    const low = finiteOrUndefined(min);
    const high = finiteOrUndefined(max);
    if (low !== undefined && high !== undefined && low > high) {
        return { min: high, max: low };
    }
    return { min: low, max: high };
};

/** Validates taxonomy ids (throws on invalid ones) and normalizes ranges. */
export function normalizeListingFilters(filters: ListingFilters): NormalizedListingFilters {
    const { resolvedFamily, resolvedCategory } = resolveTaxonomyFilter(
        filters.familyId,
        filters.categoryId,
    );
    const price = orderedRange(filters.minPrice, filters.maxPrice);
    const year = orderedRange(filters.minYear, filters.maxYear);

    return {
        tokens: tokenizeSearchQuery(filters.query),
        familyId: resolvedFamily,
        categoryId: resolvedCategory,
        listingType: filters.listingType,
        excludePersonal: shouldExcludePersonalListings(filters.listingType, resolvedFamily),
        priceCurrency: filters.priceCurrency ?? "USD",
        minPrice: price.min,
        maxPrice: price.max,
        minYear: year.min,
        maxYear: year.max,
    };
}

export function hasPriceFilter(filters: NormalizedListingFilters) {
    return filters.minPrice !== undefined || filters.maxPrice !== undefined;
}

export function hasYearFilter(filters: NormalizedListingFilters) {
    return filters.minYear !== undefined || filters.maxYear !== undefined;
}

// ---------------------------------------------------------------------------
// Product field helpers
// ---------------------------------------------------------------------------

const getProductCurrency = (product: Doc<"products">): PriceCurrency | null => {
    if (product.currency === "USD" || product.currency === "ARS") {
        return product.currency;
    }
    // Missing or legacy currencies (e.g. "MXN") cannot be compared reliably.
    return null;
};

/**
 * Converts the product price to `target`. Returns null when the listing has no
 * price, uses an unknown currency, or needs a conversion while no exchange
 * rate is available (in that case only same-currency listings compare).
 */
export function getProductPriceIn(
    product: Doc<"products">,
    target: PriceCurrency,
    rate: UsdArsRate | null,
): number | null {
    if (typeof product.price !== "number" || !Number.isFinite(product.price)) {
        return null;
    }

    const currency = getProductCurrency(product);
    if (!currency) {
        return null;
    }
    if (currency === target) {
        return product.price;
    }
    if (!rate) {
        return null;
    }

    return currency === "USD"
        ? product.price * rate.usdArs
        : product.price / rate.usdArs;
}

const MIN_VALID_YEAR = 1900;
const MAX_VALID_YEAR = 2100;

export function getProductYear(product: Doc<"products">): number | null {
    const raw = product.attributes?.year;
    const year = typeof raw === "number"
        ? raw
        : typeof raw === "string"
            ? Number.parseInt(raw, 10)
            : Number.NaN;

    if (!Number.isFinite(year) || year < MIN_VALID_YEAR || year > MAX_VALID_YEAR) {
        return null;
    }
    return Math.trunc(year);
}

function buildProductHaystack(product: Doc<"products">) {
    const attributeText = Object.values(product.attributes ?? {}).flatMap((value) => {
        if (typeof value === "string") {
            return [value];
        }
        if (Array.isArray(value)) {
            return value;
        }
        return [];
    });

    return normalizeProductSearchTerm([
        product.name,
        product.description,
        product.searchText,
        product.category,
        getCategoryById(product.categoryId)?.label,
        product.location?.label,
        product.location?.address,
        ...attributeText,
    ].filter(Boolean).join(" "));
}

export function matchesSearchTokens(product: Doc<"products">, tokens: string[]) {
    if (tokens.length === 0) {
        return true;
    }

    const haystack = buildProductHaystack(product);
    return tokens.every((token) => haystack.includes(token));
}

// ---------------------------------------------------------------------------
// Matching and sorting
// ---------------------------------------------------------------------------

export function matchesListingFilters(
    product: Doc<"products">,
    filters: NormalizedListingFilters,
    rate: UsdArsRate | null,
) {
    if (filters.listingType && product.type !== filters.listingType) {
        return false;
    }
    if (filters.familyId && product.familyId !== filters.familyId) {
        return false;
    }
    if (filters.categoryId && product.categoryId !== filters.categoryId) {
        return false;
    }
    if (filters.excludePersonal && product.familyId === PERSONAL_FAMILY_ID) {
        return false;
    }

    if (hasPriceFilter(filters)) {
        const price = getProductPriceIn(product, filters.priceCurrency, rate);
        if (price === null) {
            return false;
        }
        if (filters.minPrice !== undefined && price < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice !== undefined && price > filters.maxPrice) {
            return false;
        }
    }

    if (hasYearFilter(filters)) {
        const year = getProductYear(product);
        if (year === null) {
            return false;
        }
        if (filters.minYear !== undefined && year < filters.minYear) {
            return false;
        }
        if (filters.maxYear !== undefined && year > filters.maxYear) {
            return false;
        }
    }

    return matchesSearchTokens(product, filters.tokens);
}

const byNewest = (a: Doc<"products">, b: Doc<"products">) => b.createdAt - a.createdAt;

/**
 * Price sorts compare everything in USD. Listings without a comparable price
 * ("Consultar", unknown currency, or no rate for a conversion) go last.
 */
export function sortListings(
    products: Doc<"products">[],
    sort: ListingSort,
    rate: UsdArsRate | null,
) {
    if (sort === "recent") {
        return [...products].sort(byNewest);
    }

    const direction = sort === "price_asc" ? 1 : -1;
    const keyed = products.map((product) => {
        const usd = getProductPriceIn(product, "USD", rate);
        if (usd !== null) {
            return { product, group: 0, amount: usd };
        }
        // Only reachable without a rate: ARS listings are ranked among
        // themselves after the USD ones instead of being mixed unconverted.
        const ars = getProductPriceIn(product, "ARS", rate);
        if (ars !== null) {
            return { product, group: 1, amount: ars };
        }
        return { product, group: 2, amount: 0 };
    });

    return keyed
        .sort((a, b) =>
            a.group - b.group ||
            (a.amount - b.amount) * direction ||
            byNewest(a.product, b.product),
        )
        .map(({ product }) => product);
}

// ---------------------------------------------------------------------------
// Candidate loading
// ---------------------------------------------------------------------------

// Same window the text search already scans. Filters and sorting run in
// memory over the most recent listings of the narrowest index available.
export const DISCOVER_SCAN_LIMIT = 500;

export async function loadCandidateListings(
    ctx: QueryCtx,
    filters: NormalizedListingFilters,
): Promise<Doc<"products">[]> {
    const { familyId, categoryId, listingType } = filters;

    if (familyId && categoryId) {
        return await ctx.db
            .query("products")
            .withIndex("by_family_category", (q) =>
                q.eq("familyId", familyId).eq("categoryId", categoryId),
            )
            .order("desc")
            .take(DISCOVER_SCAN_LIMIT);
    }

    if (familyId) {
        return await ctx.db
            .query("products")
            .withIndex("by_family", (q) => q.eq("familyId", familyId))
            .order("desc")
            .take(DISCOVER_SCAN_LIMIT);
    }

    if (listingType) {
        return await ctx.db
            .query("products")
            .withIndex("by_type", (q) => q.eq("type", listingType))
            .order("desc")
            .take(DISCOVER_SCAN_LIMIT);
    }

    return await ctx.db
        .query("products")
        .withIndex("by_createdAt")
        .order("desc")
        .take(DISCOVER_SCAN_LIMIT);
}

export function parseOffsetCursor(cursor?: string | null) {
    if (!cursor) {
        return 0;
    }
    const parsed = Number.parseInt(cursor, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Runs filters + sort and returns one offset-based page. */
export async function discoverListings(
    ctx: QueryCtx,
    args: {
        filters: ListingFilters;
        sort?: ListingSort;
        offset: number;
        limit: number;
        rate: UsdArsRate | null;
    },
) {
    const filters = normalizeListingFilters(args.filters);
    const candidates = await loadCandidateListings(ctx, filters);
    const matching = sortListings(
        candidates.filter((product) => matchesListingFilters(product, filters, args.rate)),
        args.sort ?? "recent",
        args.rate,
    );
    const page = matching.slice(args.offset, args.offset + args.limit);
    const nextOffset = args.offset + page.length;
    const hasMore = nextOffset < matching.length;

    return {
        page,
        hasMore,
        nextCursor: hasMore ? String(nextOffset) : null,
    };
}
