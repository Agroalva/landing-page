import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getCategoryById } from "../../config/taxonomy";
import type { CategoryId, FamilyId } from "../../config/taxonomy";
import { normalizeProductSearchTerm } from "../productSearch";
import { resolveTaxonomyFilter, shouldExcludePersonalListings } from "../taxonomy";
import type { UsdArsRate } from "./exchangeRate";
import type { ListingFilters, ListingSort, PriceCurrency } from "./listingFilterValidators";
import { isListingActive } from "../../config/listing-status";

export {
    listingFilterFields,
    listingFiltersValidator,
    listingSortValidator,
    listingTypeValidator,
    nearFilterValidator,
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
    near?: {
        latitude: number;
        longitude: number;
        radiusKm: number;
    };
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
    const near = normalizeNear(filters.near);

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
        near,
    };
}

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 500;

function normalizeNear(near: ListingFilters["near"]) {
    if (!near) {
        return undefined;
    }
    const { latitude, longitude, radiusKm } = near;
    if (
        !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusKm) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180
    ) {
        throw new Error("La ubicación de búsqueda no es válida");
    }
    return {
        latitude,
        longitude,
        radiusKm: Math.min(Math.max(radiusKm, MIN_RADIUS_KM), MAX_RADIUS_KM),
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

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance, or null when the listing has no coordinates. */
export function getDistanceKm(
    product: Doc<"products">,
    point: { latitude: number; longitude: number },
): number | null {
    const location = product.location;
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
        return null;
    }

    const dLat = toRadians(location.latitude - point.latitude);
    const dLng = toRadians(location.longitude - point.longitude);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(point.latitude)) *
        Math.cos(toRadians(location.latitude)) *
        Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
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
    // Paused, sold and rented listings never show up in discovery or alerts.
    if (!isListingActive(product.status)) {
        return false;
    }
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

    if (filters.near) {
        const distance = getDistanceKm(product, filters.near);
        if (distance === null || distance > filters.near.radiusKm) {
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
    near?: NormalizedListingFilters["near"],
) {
    if (sort === "distance" && near) {
        return products
            .map((product) => ({ product, distance: getDistanceKm(product, near) ?? Number.POSITIVE_INFINITY }))
            .sort((a, b) => a.distance - b.distance || byNewest(a.product, b.product))
            .map(({ product }) => product);
    }

    if (sort === "recent" || sort === "distance") {
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

// Per side of the user's latitude, so the closest listings are always read
// first: if a dense band hits the cap, the effective radius shrinks instead of
// dropping arbitrary listings.
const NEAR_SCAN_LIMIT_PER_SIDE = 400;
// Shortest length of one degree of latitude, so the band never falls short.
const MIN_KM_PER_LATITUDE_DEGREE = 110.5;

async function loadListingsInLatitudeBand(
    ctx: QueryCtx,
    near: NonNullable<NormalizedListingFilters["near"]>,
) {
    const deltaLatitude = near.radiusKm / MIN_KM_PER_LATITUDE_DEGREE;
    const [north, south] = await Promise.all([
        ctx.db
            .query("products")
            .withIndex("by_latitude", (q) =>
                q.gte("location.latitude", near.latitude)
                    .lte("location.latitude", near.latitude + deltaLatitude),
            )
            .order("asc")
            .take(NEAR_SCAN_LIMIT_PER_SIDE),
        ctx.db
            .query("products")
            .withIndex("by_latitude", (q) =>
                q.gte("location.latitude", near.latitude - deltaLatitude)
                    .lt("location.latitude", near.latitude),
            )
            .order("desc")
            .take(NEAR_SCAN_LIMIT_PER_SIDE),
    ]);
    return [...north, ...south];
}

export async function loadCandidateListings(
    ctx: QueryCtx,
    filters: NormalizedListingFilters,
): Promise<Doc<"products">[]> {
    const { familyId, categoryId, listingType, near } = filters;

    if (near) {
        // Longitude and the rest of the filters are checked in memory.
        return await loadListingsInLatitudeBand(ctx, near);
    }

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
        filters.near,
    );
    const page = matching.slice(args.offset, args.offset + args.limit);
    const nextOffset = args.offset + page.length;
    const hasMore = nextOffset < matching.length;
    const near = filters.near;

    return {
        page: page.map((product) => ({
            product,
            distanceKm: near ? getDistanceKm(product, near) ?? undefined : undefined,
        })),
        hasMore,
        nextCursor: hasMore ? String(nextOffset) : null,
    };
}
