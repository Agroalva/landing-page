import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Generate upload URL for client
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        return await ctx.storage.generateUploadUrl();
    },
});

// Get download URL for a stored file
export const getDownloadUrl = query({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        return await ctx.storage.getUrl(args.storageId);
    },
});

// Delete a stored file
export const deleteFile = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Note: In a production app, you might want to check file ownership
        // by tracking file ownership in your schema before allowing deletion

        await ctx.storage.delete(args.storageId);
    },
});

