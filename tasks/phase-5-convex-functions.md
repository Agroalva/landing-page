# Phase 5 — Convex Functions (Secure)

## Overview
Implement secure Convex functions (queries and mutations) for users, posts, conversations, and search. All functions should authenticate users and enforce authorization.

## Tasks

### 1. User Functions
Create `apps/app/convex/users.ts`:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";

// Get current user's profile
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return null;
        }

        return await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user.id))
            .first();
    },
});

// Update current user's profile
export const updateProfile = mutation({
    args: {
        displayName: v.optional(v.string()),
        bio: v.optional(v.string()),
        avatarId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user.id))
            .first();

        if (!profile) {
            // Create profile if it doesn't exist
            return await ctx.db.insert("profiles", {
                userId: user.id,
                displayName: args.displayName || user.email || "User",
                bio: args.bio,
                avatarId: args.avatarId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // Update existing profile
        return await ctx.db.patch(profile._id, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});
```

### 2. Post Functions
Create `apps/app/convex/posts.ts`:

```typescript
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
            authorId: user.id,
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

        if (post.authorId !== user.id) {
            throw new Error("Not authorized to delete this post");
        }

        await ctx.db.delete(args.postId);
    },
});
```

### 3. Conversation Functions
Create `apps/app/convex/conversations.ts`:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Ensure a conversation exists between members, create if not
export const ensureConversation = mutation({
    args: {
        memberIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        if (!args.memberIds.includes(user.id)) {
            throw new Error("You must be a member of the conversation");
        }

        // Sort member IDs for consistent lookup
        const sortedMembers = [...args.memberIds].sort();

        // Check if conversation already exists
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_memberIds", (q) => q.eq("memberIds", sortedMembers))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new conversation
        return await ctx.db.insert("conversations", {
            memberIds: sortedMembers,
            createdAt: Date.now(),
        });
    },
});

// List conversations for current user
export const listForUser = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        // Get all conversations where user is a member
        const conversations = await ctx.db
            .query("conversations")
            .collect();

        return conversations.filter(c => c.memberIds.includes(user.id));
    },
});

// Send a message in a conversation
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        text: v.string(),
        mediaId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (!conversation.memberIds.includes(user.id)) {
            throw new Error("Not a member of this conversation");
        }

        // Create message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user.id,
            text: args.text,
            mediaId: args.mediaId,
            createdAt: Date.now(),
        });

        // Update conversation lastMessageAt
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });

        return messageId;
    },
});

// List messages in a conversation
export const listMessages = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.memberIds.includes(user.id)) {
            return [];
        }

        const limit = args.limit || 50;

        return await ctx.db
            .query("messages")
            .withIndex("by_conversationId_createdAt", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .take(limit);
    },
});
```

### 4. Search Functions
Create `apps/app/convex/search.ts`:

```typescript
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
```

## Verification Checklist
- [ ] All functions authenticate users where needed
- [ ] Authorization checks enforce ownership (e.g., deletePost)
- [ ] Input validation with `convex/values`
- [ ] Error messages are clear and helpful
- [ ] Functions use indexes for efficient queries
- [ ] No TypeScript errors
- [ ] Functions export correctly in `_generated/api.d.ts`

## Security Checklist
- [ ] All mutations require authentication
- [ ] Queries that return user-specific data check membership
- [ ] Ownership checks before delete/update operations
- [ ] Input sanitization (especially for text fields)
- [ ] Rate limiting considered (to be added in Phase 9)

## Notes
- Use `authComponent.getAuthUser(ctx)` to get current user
- Always check if user exists before proceeding
- Validate all inputs using `convex/values` validators
- Use indexes for efficient queries
- Consider pagination for large result sets
- Error messages should be user-friendly but not expose internals

