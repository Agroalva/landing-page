import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ConvexClientProvider from "../components/ConvexClientProvider";

export default function RootLayout() {
  return (
    <ConvexClientProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="create-post" options={{ presentation: "modal" }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
      </Stack>
    </ConvexClientProvider>
  );
}
