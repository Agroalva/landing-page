import { ReactNode } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(
    process.env.EXPO_PUBLIC_CONVEX_URL!,
    {
        // Optionally pause queries until the user is authenticated
        expectAuth: true,
        unsavedChangesWarning: false,
    }
);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ConvexProvider client={convex}>
            <ConvexBetterAuthProvider client={convex} authClient={authClient}>
                {children}
            </ConvexBetterAuthProvider>
        </ConvexProvider>
    );
}
