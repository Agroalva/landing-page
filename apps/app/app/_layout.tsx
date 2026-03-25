import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
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
  const [appIsReady, setAppIsReady] = useState(false);
  const hasHiddenSplashRef = useRef(false);

  const isLoading = isAuthLoading;

  const markAppReady = useCallback(async () => {
    if (hasHiddenSplashRef.current) {
      return;
    }

    hasHiddenSplashRef.current = true;
    setAppIsReady(true);
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      try {
        if (!isLoading) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (!cancelled) {
            await markAppReady();
          }
        }
      } catch (e) {
        console.warn(e);
        if (!cancelled) {
          await markAppReady();
        }
      }
    };

    prepare();

    return () => {
      cancelled = true;
    };
  }, [isLoading, markAppReady]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      markAppReady().catch((error) => {
        console.warn("Failed to hide splash screen after timeout:", error);
      });
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [markAppReady]);

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
        <Stack.Screen name="product/[id]" options={{ presentation: "card" }} />
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
