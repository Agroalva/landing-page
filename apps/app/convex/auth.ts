import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { components } from "./_generated/api";
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
        logger: {
            disabled: optionsOnly,
        },
        baseURL: siteUrl,
        database: authComponent.adapter(ctx),
        // Configure simple, non-verified email/password to get started
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
        },
        trustedOrigins: ["app://"], // Scheme from app.json for deep linking
        plugins: [
            // The Convex plugin is required for Convex compatibility
            convex(),
            // Expo plugin for Expo-specific features (social auth, secure storage)
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

