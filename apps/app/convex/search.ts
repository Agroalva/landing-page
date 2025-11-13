import { query } from "./_generated/server";
import { v } from "convex/values";

// Simple search across products and profiles
export const querySearch = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        const searchTerm = args.query.toLowerCase().trim();

        // Require minimum 3 characters to avoid expensive queries
        if (!searchTerm || searchTerm.length < 3) {
            return { products: [], profiles: [] };
        }

        // Limit the number of records we fetch before filtering
        // Fetch recent products/profiles first (most relevant) and limit to reasonable amount
        const MAX_FETCH = 500;
        
        // Search products - fetch recent products first, then filter
        const recentProducts = await ctx.db
            .query("products")
            .withIndex("by_createdAt")
            .order("desc")
            .take(MAX_FETCH);
        
        const matchingProducts = recentProducts
            .filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm)
            )
            .slice(0, limit);

        // Search profiles - fetch all profiles but limit the fetch
        const allProfiles = await ctx.db
            .query("profiles")
            .take(MAX_FETCH);
        
        const matchingProfiles = allProfiles
            .filter(profile =>
                profile.displayName.toLowerCase().includes(searchTerm) ||
                profile.bio?.toLowerCase().includes(searchTerm)
            )
            .slice(0, limit);

        return {
            products: matchingProducts,
            profiles: matchingProfiles,
        };
    },
});

