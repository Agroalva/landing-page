import { ReactNode } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { View, Text, StyleSheet } from "react-native";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    console.error("EXPO_PUBLIC_CONVEX_URL is not set! The app will not work without it.");
}

const convex = convexUrl
    ? new ConvexReactClient(convexUrl, {
          // Optionally pause queries until the user is authenticated
          expectAuth: true,
          unsavedChangesWarning: false,
      })
    : null;

function ErrorScreen({ message }: { message: string }) {
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Configuration Error</Text>
            <Text style={styles.errorMessage}>{message}</Text>
            <Text style={styles.errorHint}>
                Please check that EXPO_PUBLIC_CONVEX_URL is set in your build configuration.
            </Text>
        </View>
    );
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
    if (!convex) {
        return (
            <ErrorScreen
                message="EXPO_PUBLIC_CONVEX_URL environment variable is missing. Please configure it in your EAS build settings or .env.local file."
            />
        );
    }

    return (
        <ConvexProvider client={convex}>
            <ConvexBetterAuthProvider client={convex} authClient={authClient}>
                {children}
            </ConvexBetterAuthProvider>
        </ConvexProvider>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#d32f2f",
    },
    errorMessage: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 12,
        color: "#333",
    },
    errorHint: {
        fontSize: 14,
        textAlign: "center",
        color: "#666",
        fontStyle: "italic",
    },
});
