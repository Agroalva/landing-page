import { query } from "./_generated/server";
import { v } from "convex/values";

// Simple search across posts and profiles
export const querySearch = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        const searchTerm = args.query.toLowerCase().trim();

        if (!searchTerm) {
            return { posts: [], profiles: [] };
        }

        // Search posts
        const allPosts = await ctx.db.query("posts").collect();
        const matchingPosts = allPosts
            .filter(post => post.text.toLowerCase().includes(searchTerm))
            .slice(0, limit);

        // Search profiles
        const allProfiles = await ctx.db.query("profiles").collect();
        const matchingProfiles = allProfiles
            .filter(profile =>
                profile.displayName.toLowerCase().includes(searchTerm) ||
                profile.bio?.toLowerCase().includes(searchTerm)
            )
            .slice(0, limit);

        return {
            posts: matchingPosts,
            profiles: matchingProfiles,
        };
    },
});

