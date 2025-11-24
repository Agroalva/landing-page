import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";

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
    returns: v.array(
        v.object({
            _id: v.id("conversations"),
            _creationTime: v.number(),
            memberIds: v.array(v.string()),
            lastMessageAt: v.optional(v.number()),
            lastMessageText: v.optional(v.string()),
            lastMessageSenderId: v.optional(v.string()),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        // Get all conversations where user is a member
        const conversations = await ctx.db
            .query("conversations")
            .collect();

        const userConversations = conversations.filter(c => 
            c.memberIds.includes(user._id as string)
        );

        // Sort by lastMessageAt descending (most recent first)
        return userConversations.sort((a, b) => {
            const aTime = a.lastMessageAt || a.createdAt;
            const bTime = b.lastMessageAt || b.createdAt;
            return bTime - aTime;
        });
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
            readBy: [user._id as string], // Sender has read their own message
            createdAt: Date.now(),
        });

        // Update conversation with last message info
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
            lastMessageText: args.text,
            lastMessageSenderId: user._id as string,
        });

        // Create notifications for other members
        const otherMembers = conversation.memberIds.filter(
            (id) => id !== (user._id as string)
        );
        for (const memberId of otherMembers) {
            await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
                userId: memberId,
                type: "message",
                title: "Nuevo mensaje",
                body: args.text.length > 50 ? args.text.substring(0, 50) + "..." : args.text,
                relatedId: args.conversationId,
            });
        }

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

// Mark messages as read for current user
export const markMessagesAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.memberIds.includes(user._id as string)) {
            throw new Error("Conversation not found or not a member");
        }

        // Get all unread messages in this conversation
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        const userId = user._id as string;

        // Update messages that haven't been read by this user
        for (const message of messages) {
            const readBy = message.readBy || [];
            if (!readBy.includes(userId)) {
                await ctx.db.patch(message._id, {
                    readBy: [...readBy, userId],
                });
            }
        }

        return null;
    },
});

// Get unread count for a conversation
export const getUnreadCount = query({
    args: {
        conversationId: v.id("conversations"),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return 0;
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.memberIds.includes(user._id as string)) {
            return 0;
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        const userId = user._id as string;
        let unreadCount = 0;

        for (const message of messages) {
            const readBy = message.readBy || [];
            if (!readBy.includes(userId) && message.senderId !== userId) {
                unreadCount++;
            }
        }

        return unreadCount;
    },
});

