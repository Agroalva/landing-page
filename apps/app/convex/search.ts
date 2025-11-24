import { query } from "./_generated/server";
import { v } from "convex/values";

// Search across products and profiles with category filtering and pagination
export const querySearch = query({
    args: {
        query: v.string(),
        category: v.optional(v.string()),
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
        
        if (args.category && args.category !== "Todos") {
            // Filter by category using index
            const categoryQuery = ctx.db
                .query("products")
                .withIndex("by_category_createdAt", (q) => 
                    q.eq("category", args.category)
                )
                .order("desc");
            
            const allCategoryProducts = await categoryQuery.take(100);
            
            matchingProducts = allCategoryProducts
                .filter(product => 
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description?.toLowerCase().includes(searchTerm)
                )
                .slice(0, limit);
        } else {
            // Search all products, limit initial fetch for performance
            const recentProducts = await ctx.db
                .query("products")
                .withIndex("by_createdAt")
                .order("desc")
                .take(100); // Reduced from 500 for better performance
            
            matchingProducts = recentProducts
                .filter(product => 
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description?.toLowerCase().includes(searchTerm)
                )
                .slice(0, limit);
        }

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

