import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Create a new post
export const create = mutation({
    args: {
        text: v.string(),
        mediaIds: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        if (!args.text.trim()) {
            throw new Error("Post text cannot be empty");
        }

        return await ctx.db.insert("posts", {
            authorId: user._id as string,
            text: args.text,
            mediaIds: args.mediaIds || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Get feed of posts (chronological)
export const feed = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        
        return await ctx.db
            .query("posts")
            .withIndex("by_createdAt")
            .order("desc")
            .take(limit);
    },
});

// Get posts by a specific user
export const byUser = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        
        return await ctx.db
            .query("posts")
            .withIndex("by_authorId", (q) => q.eq("authorId", args.userId))
            .order("desc")
            .take(limit);
    },
});

// Delete a post (only by author)
export const deletePost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const post = await ctx.db.get(args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        if (post.authorId !== (user._id as string)) {
            throw new Error("Not authorized to delete this post");
        }

        await ctx.db.delete(args.postId);
    },
});

