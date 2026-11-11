import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { authComponent } from "./auth";
import { getCategoryById, getFamilyById } from "../config/taxonomy";
import { loadUsdArsRate } from "./lib/exchangeRate";
import type { UsdArsRate } from "./lib/exchangeRate";
import {
    hasPriceFilter,
    hasYearFilter,
    listingFilterFields,
    listingSortValidator,
    matchesListingFilters,
    normalizeListingFilters,
} from "./lib/listingFilters";
import type { ListingFilters, NormalizedListingFilters } from "./lib/listingFilters";
import { savedSearchesTable } from "./schema/savedSearches";

const MAX_SAVED_SEARCHES_PER_USER = 20;
const MATCH_BATCH_SIZE = 100;
const ALERT_WINDOW_MS = 24 * 60 * 60 * 1000;
// Caps alerts per saved search per day so a bulk upload doesn't flood a user;
// the remaining listings are still visible when they open the search.
const MAX_ALERTS_PER_SEARCH_PER_DAY = 10;

const savedSearchValidator = v.object({
    _id: v.id("savedSearches"),
    _creationTime: v.number(),
    ...savedSearchesTable.validator.fields,
});

const pickListingFilters = (source: ListingFilters): ListingFilters => ({
    query: source.query,
    familyId: source.familyId,
    categoryId: source.categoryId,
    listingType: source.listingType,
    minPrice: source.minPrice,
    maxPrice: source.maxPrice,
    priceCurrency: source.priceCurrency,
    minYear: source.minYear,
    maxYear: source.maxYear,
});

// Labels stay in sync with the mobile intents in app/(tabs)/search.tsx.
const getIntentLabel = (topLevel?: string, listingType?: "rent" | "sell") => {
    if (topLevel === "personal") {
        return "Personal";
    }
    if (topLevel === "services" || listingType === "rent") {
        return "Servicios";
    }
    if (topLevel === "products" || listingType === "sell") {
        return "Compra y Venta";
    }
    return undefined;
};

const formatInteger = (value: number) =>
    Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function buildSavedSearchLabel(
    query: string | undefined,
    filters: NormalizedListingFilters,
    topLevel?: string,
) {
    const parts: string[] = [];

    if (query) {
        parts.push(`“${query}”`);
    }

    const taxonomyLabel = getCategoryById(filters.categoryId)?.label
        ?? getFamilyById(filters.familyId)?.label
        ?? getIntentLabel(topLevel, filters.listingType);
    if (taxonomyLabel) {
        parts.push(taxonomyLabel);
    }

    if (hasPriceFilter(filters)) {
        const symbol = filters.priceCurrency === "ARS" ? "AR$" : "US$";
        const { minPrice, maxPrice } = filters;
        parts.push(
            minPrice !== undefined && maxPrice !== undefined
                ? `${symbol} ${formatInteger(minPrice)}–${formatInteger(maxPrice)}`
                : minPrice !== undefined
                    ? `desde ${symbol} ${formatInteger(minPrice)}`
                    : `hasta ${symbol} ${formatInteger(maxPrice!)}`,
        );
    }

    if (hasYearFilter(filters)) {
        const { minYear, maxYear } = filters;
        parts.push(
            minYear !== undefined && maxYear !== undefined
                ? `año ${minYear}–${maxYear}`
                : minYear !== undefined
                    ? `año ${minYear} o más`
                    : `año ${maxYear} o anterior`,
        );
    }

    return parts.length > 0 ? parts.join(" · ") : "Todas las publicaciones";
}

// Identifies "the same search" to avoid saving duplicates.
const getSearchSignature = (search: ListingFilters & { query?: string }) =>
    JSON.stringify({
        ...pickListingFilters(search),
        query: search.query?.trim().toLowerCase() || undefined,
    });

async function requireUserId(ctx: MutationCtx) {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
        throw new Error("Not authenticated");
    }
    return user._id as string;
}

export const list = query({
    args: {},
    returns: v.array(savedSearchValidator),
    handler: async (ctx) => {
        let userId: string;
        try {
            const user = await authComponent.getAuthUser(ctx);
            if (!user) {
                return [];
            }
            userId = user._id as string;
        } catch {
            return [];
        }

        return await ctx.db
            .query("savedSearches")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(MAX_SAVED_SEARCHES_PER_USER);
    },
});

export const create = mutation({
    args: {
        ...listingFilterFields,
        topLevel: v.optional(v.string()),
        sort: v.optional(listingSortValidator),
    },
    returns: v.object({
        savedSearchId: v.id("savedSearches"),
        alreadySaved: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const query = args.query?.trim() || undefined;
        // Validates taxonomy ids and normalizes ranges (category implies family).
        const normalized = normalizeListingFilters({ ...pickListingFilters(args), query });

        const hasCriteria = normalized.tokens.length > 0 ||
            normalized.familyId !== undefined ||
            normalized.listingType !== undefined ||
            hasPriceFilter(normalized) ||
            hasYearFilter(normalized);
        if (!hasCriteria) {
            throw new ConvexError("Escribí una búsqueda o elegí un filtro antes de guardarla");
        }

        const filters: ListingFilters = {
            query,
            familyId: normalized.familyId,
            categoryId: normalized.categoryId,
            listingType: normalized.listingType,
            minPrice: normalized.minPrice,
            maxPrice: normalized.maxPrice,
            priceCurrency: hasPriceFilter(normalized) ? normalized.priceCurrency : undefined,
            minYear: normalized.minYear,
            maxYear: normalized.maxYear,
        };

        const existing = await ctx.db
            .query("savedSearches")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(MAX_SAVED_SEARCHES_PER_USER + 1);
        const signature = getSearchSignature(filters);
        const duplicate = existing.find((search) => getSearchSignature(search) === signature);
        if (duplicate) {
            if (!duplicate.alertsEnabled) {
                await ctx.db.patch(duplicate._id, { alertsEnabled: true, updatedAt: Date.now() });
            }
            return { savedSearchId: duplicate._id, alreadySaved: true };
        }

        if (existing.length >= MAX_SAVED_SEARCHES_PER_USER) {
            throw new ConvexError(
                `Podés guardar hasta ${MAX_SAVED_SEARCHES_PER_USER} búsquedas. Borrá alguna para guardar otra.`,
            );
        }

        const now = Date.now();
        const savedSearchId = await ctx.db.insert("savedSearches", {
            userId,
            label: buildSavedSearchLabel(query, normalized, args.topLevel),
            ...filters,
            topLevel: args.topLevel,
            sort: args.sort,
            alertsEnabled: true,
            createdAt: now,
            updatedAt: now,
        });

        return { savedSearchId, alreadySaved: false };
    },
});

export const setAlertsEnabled = mutation({
    args: {
        savedSearchId: v.id("savedSearches"),
        enabled: v.boolean(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const search = await ctx.db.get(args.savedSearchId);
        if (!search || search.userId !== userId) {
            throw new Error("Búsqueda no encontrada");
        }

        await ctx.db.patch(args.savedSearchId, {
            alertsEnabled: args.enabled,
            updatedAt: Date.now(),
        });
        return null;
    },
});

export const remove = mutation({
    args: {
        savedSearchId: v.id("savedSearches"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const search = await ctx.db.get(args.savedSearchId);
        if (!search) {
            return null;
        }
        if (search.userId !== userId) {
            throw new Error("Not authorized");
        }

        // savedSearchAlerts rows are kept: they are the per-user history that
        // prevents alerting twice about the same listing.
        await ctx.db.delete(args.savedSearchId);
        return null;
    },
});

// ---------------------------------------------------------------------------
// Matching new listings
// ---------------------------------------------------------------------------

type MatchStage = { familyId?: string; categoryId?: string };

// Saved searches that can include a listing: same category, same family with
// no category, or no taxonomy at all. Saved searches always store the family
// when they have a category, so these three buckets cover every candidate.
const getMatchStages = (product: Doc<"products">): MatchStage[] => {
    const stages: MatchStage[] = [];
    if (product.familyId && product.categoryId) {
        stages.push({ familyId: product.familyId, categoryId: product.categoryId });
    }
    if (product.familyId) {
        stages.push({ familyId: product.familyId, categoryId: undefined });
    }
    stages.push({ familyId: undefined, categoryId: undefined });
    return stages;
};

async function alertIfMatching(
    ctx: MutationCtx,
    search: Doc<"savedSearches">,
    product: Doc<"products">,
    rate: UsdArsRate | null,
) {
    if (search.userId === product.authorId) {
        return;
    }

    let filters: NormalizedListingFilters;
    try {
        filters = normalizeListingFilters(pickListingFilters(search));
    } catch {
        // Taxonomy changed since the search was saved; skip instead of failing the batch.
        return;
    }
    if (!matchesListingFilters(product, filters, rate)) {
        return;
    }

    const alreadyAlerted = await ctx.db
        .query("savedSearchAlerts")
        .withIndex("by_userId_productId", (q) =>
            q.eq("userId", search.userId).eq("productId", product._id),
        )
        .first();
    if (alreadyAlerted) {
        return;
    }

    const now = Date.now();
    const recentAlerts = await ctx.db
        .query("savedSearchAlerts")
        .withIndex("by_savedSearchId_createdAt", (q) =>
            q.eq("savedSearchId", search._id).gte("createdAt", now - ALERT_WINDOW_MS),
        )
        .take(MAX_ALERTS_PER_SEARCH_PER_DAY);
    if (recentAlerts.length >= MAX_ALERTS_PER_SEARCH_PER_DAY) {
        return;
    }

    await ctx.db.insert("savedSearchAlerts", {
        userId: search.userId,
        savedSearchId: search._id,
        productId: product._id,
        createdAt: now,
    });
    await ctx.db.patch(search._id, { lastAlertAt: now });
    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        userId: search.userId,
        type: "saved_search",
        title: "Nueva publicación para tu búsqueda",
        body: `${product.name} · coincide con ${search.label}`,
        relatedId: product._id,
    });
}

/**
 * Scheduled from products.create. Walks the candidate saved searches in
 * batches (rescheduling itself) so listing creation never waits on it.
 */
export const matchNewProduct = internalMutation({
    args: {
        productId: v.id("products"),
        stage: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) {
            return null;
        }

        const stages = getMatchStages(product);
        const stageIndex = args.stage ?? 0;
        const stage = stages[stageIndex];
        if (!stage) {
            return null;
        }

        const page = await ctx.db
            .query("savedSearches")
            .withIndex("by_alerts_family_category", (q) =>
                q
                    .eq("alertsEnabled", true)
                    .eq("familyId", stage.familyId)
                    .eq("categoryId", stage.categoryId),
            )
            .paginate({ numItems: MATCH_BATCH_SIZE, cursor: args.cursor ?? null });

        const rate = await loadUsdArsRate(ctx);
        for (const search of page.page) {
            await alertIfMatching(ctx, search, product, rate);
        }

        if (!page.isDone) {
            await ctx.scheduler.runAfter(0, internal.savedSearches.matchNewProduct, {
                productId: args.productId,
                stage: stageIndex,
                cursor: page.continueCursor,
            });
        } else if (stageIndex + 1 < stages.length) {
            await ctx.scheduler.runAfter(0, internal.savedSearches.matchNewProduct, {
                productId: args.productId,
                stage: stageIndex + 1,
            });
        }

        return null;
    },
});
