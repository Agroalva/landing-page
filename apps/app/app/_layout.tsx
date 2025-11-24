import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ConvexClientProvider from "../components/ConvexClientProvider";
import { useNotifications } from "../hooks/use-notifications";

function NotificationInitializer() {
  useNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <ConvexClientProvider>
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
      </Stack>
    </ConvexClientProvider>
  );
}
