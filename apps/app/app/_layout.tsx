import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useConvexAuth } from "convex/react";
import ConvexClientProvider from "../components/ConvexClientProvider";
import { useNotifications } from "../hooks/use-notifications";
import { useAuthSession } from "../hooks/use-session";
import LoadingScreen from "../components/LoadingScreen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function NotificationInitializer() {
  useNotifications();
  return null;
}

function AppContent() {
  const { isLoading: isAuthLoading } = useAuthSession();
  const { isLoading: isConvexLoading } = useConvexAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  const isLoading = isAuthLoading || isConvexLoading;

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for auth and Convex to be ready
        if (!isLoading) {
          // Small delay to ensure everything is fully initialized
          await new Promise((resolve) => setTimeout(resolve, 300));
          setAppIsReady(true);
          // Hide the splash screen once everything is ready
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
        // Even if there's an error, hide the splash screen
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    if (isLoading === false) {
      prepare();
    }
  }, [isLoading]);

  // Show loading screen only after splash screen is hidden (if still loading)
  // While splash screen is visible, we don't render anything (splash screen handles it)
  if (!appIsReady) {
    return null; // Let the native splash screen show
  }

  // If still loading after splash screen is hidden, show our loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NotificationInitializer />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="user-profile/[userId]" options={{ presentation: "card" }} />
        <Stack.Screen name="create-post" options={{ presentation: "modal" }} />
        <Stack.Screen name="new-message" options={{ presentation: "card" }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="notifications" options={{ presentation: "card" }} />
        <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="edit-product/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ConvexClientProvider>
      <AppContent />
    </ConvexClientProvider>
  );
}
