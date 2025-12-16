import { query } from "./_generated/server";
import { v } from "convex/values";
import { resolveTaxonomyFilter } from "./taxonomy";

// Search across products and profiles with category filtering and pagination
export const querySearch = query({
    args: {
        query: v.string(),
        familyId: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        legacyCategory: v.optional(v.string()),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        const searchTerm = args.query.toLowerCase().trim();

        // Require minimum 3 characters to avoid expensive queries
        if (!searchTerm || searchTerm.length < 3) {
            return { 
                products: [], 
                profiles: [], 
                nextCursor: null,
                hasMore: false,
            };
        }

        // Use search index for products if available, otherwise fall back to filtered query
        let matchingProducts;
        
        const { resolvedFamily, resolvedCategory } = resolveTaxonomyFilter(args.familyId, args.categoryId);

        let productQuery;

        if (resolvedCategory) {
            if (!resolvedFamily) {
                throw new Error("No se pudo resolver la familia para la categoría seleccionada");
            }
            productQuery = ctx.db
                .query("products")
                .withIndex("by_family_category", (q) =>
                    q.eq("familyId", resolvedFamily as string).eq("categoryId", resolvedCategory as string),
                )
                .order("desc");
        } else if (resolvedFamily) {
            productQuery = ctx.db
                .query("products")
                .withIndex("by_family", (q) => q.eq("familyId", resolvedFamily as string))
                .order("desc");
        } else if (args.legacyCategory && args.legacyCategory !== "Todos") {
            productQuery = ctx.db
                .query("products")
                .withIndex("by_category_createdAt", (q) =>
                    q.eq("category", args.legacyCategory),
                )
                .order("desc");
        } else {
            productQuery = ctx.db
                .query("products")
                .withIndex("by_createdAt")
                .order("desc");
        }

        const recentProducts = await productQuery.take(100);
        
        matchingProducts = recentProducts
            .filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm)
            )
            .slice(0, limit);

        // Search profiles - limit fetch for performance
        const allProfiles = await ctx.db
            .query("profiles")
            .take(100); // Reduced from 500 for better performance
        
        const matchingProfiles = allProfiles
            .filter(profile =>
                profile.displayName.toLowerCase().includes(searchTerm) ||
                profile.bio?.toLowerCase().includes(searchTerm)
            )
            .slice(0, limit);

        // Simple pagination - return cursor for next page if needed
        const hasMore = matchingProducts.length === limit || matchingProfiles.length === limit;
        const nextCursor = hasMore ? `${matchingProducts.length}-${matchingProfiles.length}` : null;

        return {
            products: matchingProducts,
            profiles: matchingProfiles,
            nextCursor,
            hasMore,
        };
    },
});

