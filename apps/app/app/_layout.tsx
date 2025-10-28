import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// Convex deshabilitado temporalmente para el mockup
// Para habilitarlo, configura EXPO_PUBLIC_CONVEX_URL en tu archivo .env
// import { ConvexProvider, ConvexReactClient } from "convex/react";
// const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
//   unsavedChangesWarning: false,
// });

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="create-post" options={{ presentation: "modal" }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
      </Stack>
    </>
  );
}
