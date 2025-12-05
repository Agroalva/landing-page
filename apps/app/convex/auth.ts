import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
    ctx: GenericCtx<DataModel>,
    { optionsOnly } = { optionsOnly: false },
) => {
    return betterAuth({
        // Disable logging when createAuth is called just to generate options
        secret: process.env.BETTER_AUTH_SECRET!,
        logger: {
            disabled: optionsOnly,
        },
        baseURL: siteUrl,
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
            sendResetPassword: async ({ user, url }, _request) => {
                // Use Convex Resend integration to send the reset email as a background action.
                const actionCtx = ctx as any;
                await actionCtx.scheduler.runAfter(
                    0,
                    internal.emails.sendPasswordResetEmail,
                    {
                        to: user.email,
                        url,
                    },
                );
            },
            onPasswordReset: async ({ user }, _request) => {
                console.log(`Password for user ${user.email} has been reset.`);
            },
        },
        trustedOrigins: ["app://"], // Scheme from app.json for deep linking
        plugins: [
            convex(),
            expo(),
        ],
    });
};

// Example function for getting the current user
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return authComponent.getAuthUser(ctx);
    },
});

