import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authClient } from "@/lib/auth-client";
import { router, Redirect } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";

export default function SignInScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const { isAuthenticated, isLoading } = useAuthSession();

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated, isLoading]);

    const getErrorMessage = (error: any): string => {
        const errorMessage = error?.message || "";
        const errorString = String(errorMessage).toLowerCase();

        // Check for invalid credentials
        if (
            errorString.includes("invalid") ||
            errorString.includes("incorrect") ||
            errorString.includes("wrong") ||
            errorString.includes("credentials") ||
            errorString.includes("password") ||
            errorString.includes("email") ||
            errorString.includes("user not found")
        ) {
            return "Correo electrónico o contraseña incorrectos. Por favor, verifica tus credenciales.";
        }

        // Check for account not found
        if (
            errorString.includes("not found") ||
            errorString.includes("does not exist") ||
            errorString.includes("no user")
        ) {
            return "No existe una cuenta con este correo electrónico. ¿Quieres registrarte?";
        }

        // Check for network/connection errors
        if (
            errorString.includes("network") ||
            errorString.includes("connection") ||
            errorString.includes("fetch") ||
            errorString.includes("timeout")
        ) {
            return "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
        }

        // Check for account locked/suspended
        if (
            errorString.includes("locked") ||
            errorString.includes("suspended") ||
            errorString.includes("disabled")
        ) {
            return "Tu cuenta ha sido bloqueada. Por favor, contacta al soporte.";
        }

        // Default error message
        return "No se pudo iniciar sesión. Por favor, intenta nuevamente.";
    };

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Por favor completa todos los campos");
            return;
        }

        setLoading(true);
        setAuthError(null);
        try {
            await authClient.signIn.email({
                email: email.trim(),
                password,
            });
            // Session will update reactively, and useEffect will handle the redirect
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            const buttons: any[] = [
                {
                    text: "OK",
                    style: "default" as const,
                },
            ];
            
            if (errorMessage.includes("no existe una cuenta")) {
                buttons.push({
                    text: "Registrarse",
                    style: "default" as const,
                    onPress: () => router.push("/(auth)/sign-up"),
                });
            }

            setAuthError(errorMessage);
            Alert.alert("Error al iniciar sesión", errorMessage, buttons);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Bienvenido de nuevo</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
                </View>

                <View style={styles.form}>
                    {authError && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="warning-outline" size={20} color="#D32F2F" />
                            <Text style={styles.errorText}>{authError}</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#757575" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo electrónico"
                            placeholderTextColor="#9E9E9E"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor="#9E9E9E"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="password"
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#757575"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar sesión</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/sign-up")}
                            disabled={loading}
                        >
                            <Text style={styles.footerLink}>Regístrate</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#212121",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#757575",
    },
    form: {
        width: "100%",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: "#212121",
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: "#2E7D32",
        borderRadius: 12,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        shadowColor: "#2E7D32",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: "#757575",
    },
    footerLink: {
        fontSize: 14,
        color: "#2E7D32",
        fontWeight: "600",
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFEBEE",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EF9A9A",
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: "#C62828",
        marginLeft: 8,
        lineHeight: 18,
    },
});

