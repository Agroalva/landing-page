import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import type { ExpressionOrValue, FilterBuilder, NamedTableInfo } from "convex/server";

// Any products query (index query, ordered query or search query) supports filter().
type ProductsFilterable<Q> = {
    filter(
        predicate: (q: FilterBuilder<NamedTableInfo<DataModel, "products">>) => ExpressionOrValue<boolean>,
    ): Q;
};

/**
 * Keeps only active listings in a query (index or search index).
 *
 * Products created before statuses existed have no `status` field, so a plain
 * `status == "active"` filter (or a search index filterField) would drop them.
 * This filter treats a missing status as active, so it is correct whether or not
 * `backfillListingStatus` has run. Inactive listings are expected to be a small
 * share of the table, so post-filtering adds little extra scanning.
 */
export const onlyActiveListings = <Q extends ProductsFilterable<Q>>(queryBuilder: Q): Q =>
    queryBuilder.filter((q) =>
        q.or(
            q.eq(q.field("status"), undefined),
            q.eq(q.field("status"), "active"),
        ),
    );

/**
 * Optional data normalization: sets `status: "active"` on products that predate
 * listing statuses. Queries don't depend on it (see `onlyActiveListings`), but it
 * leaves the table uniform in case we later move to status-based indexes.
 *
 * Run once after deploying with:
 *   npx convex run listingStatus:backfillListingStatus
 */
export const backfillListingStatus = internalMutation({
    args: {
        cursor: v.optional(v.string()),
    },
    returns: v.object({
        processed: v.number(),
        updated: v.number(),
        isDone: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const result = await ctx.db.query("products").paginate({
            cursor: args.cursor ?? null,
            numItems: 100,
        });

        const missingStatus = result.page.filter((product) => product.status === undefined);
        await Promise.all(missingStatus.map((product) => ctx.db.patch(product._id, {
            status: "active" as const,
        })));

        if (!result.isDone) {
            await ctx.scheduler.runAfter(
                0,
                internal.listingStatus.backfillListingStatus,
                { cursor: result.continueCursor },
            );
        }

        return {
            processed: result.page.length,
            updated: missingStatus.length,
            isDone: result.isDone,
        };
    },
});
