import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

type SearchableLocation = {
    address?: string;
    label?: string;
};

export function normalizeProductSearchTerm(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function buildProductSearchText(
    name: string,
    location?: SearchableLocation,
    attributes?: { province?: unknown },
) {
    const values = [
        name,
        location?.label,
        location?.address,
        typeof attributes?.province === "string" ? attributes.province : undefined,
    ]
        .filter((value): value is string => Boolean(value?.trim()))
        .map(normalizeProductSearchTerm);

    return [...new Set(values)].join(" ");
}

/**
 * Backfills the combined search field for existing publications.
 * Run once after deploying with: npx convex run productSearch:backfillProductSearchText
 */
export const backfillProductSearchText = internalMutation({
    args: {
        cursor: v.optional(v.string()),
    },
    returns: v.object({
        processed: v.number(),
        isDone: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const result = await ctx.db.query("products").paginate({
            cursor: args.cursor ?? null,
            numItems: 100,
        });

        await Promise.all(result.page.map((product) => ctx.db.patch(product._id, {
            searchText: buildProductSearchText(product.name, product.location, product.attributes),
        })));

        if (!result.isDone) {
            await ctx.scheduler.runAfter(
                0,
                internal.productSearch.backfillProductSearchText,
                { cursor: result.continueCursor },
            );
        }

        return {
            processed: result.page.length,
            isDone: result.isDone,
        };
    },
});
