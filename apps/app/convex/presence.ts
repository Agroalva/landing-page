import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { Presence } from "@convex-dev/presence";
import { Id } from "./_generated/dataModel";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
    args: {
        roomId: v.string(),
        userId: v.string(),
        sessionId: v.string(),
        interval: v.number(),
    },
    handler: async (ctx, { roomId, userId, sessionId, interval }) => {
        // Verify user is authenticated and authorized for this room
        const user = await authComponent.getAuthUser(ctx);
        if (!user || user._id !== userId) {
            throw new Error("Not authenticated");
        }

        // Verify user is member of the conversation
        const conversationId = roomId as Id<"conversations">;
        const conversation = await ctx.db.get(conversationId);
        if (!conversation || !("memberIds" in conversation) || !conversation.memberIds.includes(userId)) {
            throw new Error("Not a member of this conversation");
        }

        return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
    },
});

export const list = query({
    args: { roomToken: v.string() },
    handler: async (ctx, { roomToken }) => {
        // Avoid adding per-user reads so all subscriptions can share same cache.
        return await presence.list(ctx, roomToken);
    },
});

export const disconnect = mutation({
    args: { sessionToken: v.string() },
    handler: async (ctx, { sessionToken }) => {
        // Can't check auth here because it's called over http from sendBeacon.
        return await presence.disconnect(ctx, sessionToken);
    },
});

