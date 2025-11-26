import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;

if (!convexSiteUrl) {
    console.error("EXPO_PUBLIC_CONVEX_SITE_URL is not set! Authentication will not work without it.");
}

export const authClient = createAuthClient({
    baseURL: convexSiteUrl || "https://placeholder.convex.site",
    plugins: [
        expoClient({
            scheme: Constants.expoConfig?.scheme as string,
            storagePrefix: Constants.expoConfig?.scheme as string,
            storage: SecureStore,
        }),
        convexClient(),
    ],
});

