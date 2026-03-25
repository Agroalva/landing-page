import { ConvexError } from "convex/values";
import { authComponent } from "../auth";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AdminCtx = MutationCtx | QueryCtx;

export async function requireAdmin(ctx: AdminCtx) {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
        throw new ConvexError("Not authenticated");
    }

    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
        .first();

    if (!profile || profile.role !== "admin") {
        throw new ConvexError("Not authorized");
    }

    return {
        user,
        profile,
    };
}

export function validateExternalUrl(url: string | null | undefined) {
    if (!url) {
        return;
    }

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(url);
    } catch {
        throw new ConvexError("Banner URL must be a valid absolute URL");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new ConvexError("Banner URL must use http or https");
    }
}
