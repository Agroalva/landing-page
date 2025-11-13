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

        if (!args.memberIds.includes(user._id as string)) {
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

        return conversations.filter(c => c.memberIds.includes(user._id as string));
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

        if (!conversation.memberIds.includes(user._id as string)) {
            throw new Error("Not a member of this conversation");
        }

        // Create message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id as string,
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
        if (!conversation || !conversation.memberIds.includes(user._id as string)) {
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

