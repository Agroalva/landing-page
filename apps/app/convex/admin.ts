import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const assignAdminRoles = internalMutation({
    args: {
        userIds: v.array(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const userId of args.userIds) {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .first();

            if (!profile) {
                continue;
            }

            await ctx.db.patch(profile._id, {
                role: "admin",
                updatedAt: Date.now(),
            });
        }

        return null;
    },
});
