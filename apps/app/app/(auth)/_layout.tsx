import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="sign-in"
                options={{ title: "Iniciar Sesión", headerShown: false }}
            />
            <Stack.Screen
                name="sign-up"
                options={{ title: "Registrarse", headerShown: false }}
            />
            <Stack.Screen
                name="forgot-password"
                options={{ title: "Recuperar contraseña", headerShown: false }}
            />
            <Stack.Screen
                name="reset-password"
                options={{ title: "Restablecer contraseña", headerShown: false }}
            />
        </Stack>
    );
}

