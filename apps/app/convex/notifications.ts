import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";

// Create a notification (internal, called by other functions)
export const createNotification = internalMutation({
    args: {
        userId: v.string(),
        type: v.union(
            v.literal("message"),
            v.literal("favorite"),
            v.literal("comment"),
            v.literal("like")
        ),
        title: v.string(),
        body: v.string(),
        relatedId: v.optional(v.string()),
    },
    returns: v.id("notifications"),
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            title: args.title,
            body: args.body,
            relatedId: args.relatedId,
            read: false,
            createdAt: Date.now(),
        });
    },
});

// Get notifications for current user
export const listForUser = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(
        v.object({
            _id: v.id("notifications"),
            _creationTime: v.number(),
            userId: v.string(),
            type: v.union(
                v.literal("message"),
                v.literal("favorite"),
                v.literal("comment"),
                v.literal("like")
            ),
            title: v.string(),
            body: v.string(),
            relatedId: v.optional(v.string()),
            read: v.boolean(),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        const limit = args.limit || 50;

        return await ctx.db
            .query("notifications")
            .withIndex("by_userId_createdAt", (q) =>
                q.eq("userId", user._id as string)
            )
            .order("desc")
            .take(limit);
    },
});

// Get unread count for current user
export const getUnreadCount = query({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return 0;
        }

        const unreadNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId_read", (q) =>
                q.eq("userId", user._id as string).eq("read", false)
            )
            .collect();

        return unreadNotifications.length;
    },
});

// Mark notification as read
export const markAsRead = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) {
            throw new Error("Notification not found");
        }

        if (notification.userId !== (user._id as string)) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.notificationId, {
            read: true,
        });

        return null;
    },
});

// Mark all notifications as read for current user
export const markAllAsRead = mutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const unreadNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId_read", (q) =>
                q.eq("userId", user._id as string).eq("read", false)
            )
            .collect();

        for (const notification of unreadNotifications) {
            await ctx.db.patch(notification._id, {
                read: true,
            });
        }

        return null;
    },
});
