import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack>
            <Stack.Screen name="sign-in" options={{ title: "Iniciar Sesión", headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ title: "Registrarse", headerShown: false }} />
        </Stack>
    );
}

