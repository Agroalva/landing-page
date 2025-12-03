import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authClient } from "@/lib/auth-client";
import { router, Redirect } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";

export default function SignUpScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [signUpSuccess, setSignUpSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const ensureProfile = useMutation(api.users.ensureProfile);
    const { isAuthenticated, isLoading } = useAuthSession();

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated, isLoading]);

    // Create profile once authentication is established after sign-up
    useEffect(() => {
        if (signUpSuccess && isAuthenticated && !isLoading) {
            // Wait a bit for Convex session to sync, with retry logic
            const attemptProfileCreation = async (attempt: number = 1) => {
                try {
                    await ensureProfile();
                    setProfileError(null);
                    setRetryCount(0);
                } catch (profileError: any) {
                    const errorMessage = profileError?.message || "Error desconocido";
                    console.error(`Failed to create profile (attempt ${attempt}):`, profileError);
                    
                    // If it's an authentication error and we haven't retried too many times, retry
                    if (errorMessage.includes("Unauthenticated") && attempt < 3) {
                        setRetryCount(attempt);
                        // Wait longer before retrying
                        setTimeout(() => attemptProfileCreation(attempt + 1), 1000 * attempt);
                    } else {
                        // Show error to user after max retries
                        setProfileError(
                            "Tu cuenta se creó correctamente, pero hubo un problema al crear tu perfil. " +
                            "Puedes continuar y tu perfil se creará automáticamente."
                        );
                        setRetryCount(0);
                    }
                }
            };

            const timer = setTimeout(() => {
                attemptProfileCreation(1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [signUpSuccess, isAuthenticated, isLoading, ensureProfile]);

    const getErrorMessage = (error: any): string => {
        const errorMessage = error?.message || "";
        const errorString = String(errorMessage).toLowerCase();

        // Check for existing email errors
        if (
            errorString.includes("already exists") ||
            errorString.includes("already registered") ||
            errorString.includes("email already") ||
            errorString.includes("user already exists") ||
            errorString.includes("existing email")
        ) {
            return "Este correo electrónico ya está registrado. ¿Ya tienes una cuenta? Inicia sesión en su lugar.";
        }

        // Check for invalid email format
        if (
            errorString.includes("invalid email") ||
            errorString.includes("email format") ||
            errorString.includes("malformed")
        ) {
            return "El formato del correo electrónico no es válido. Por favor, verifica tu correo.";
        }

        // Check for weak password errors
        if (
            errorString.includes("password") &&
            (errorString.includes("weak") || errorString.includes("short") || errorString.includes("minimum"))
        ) {
            return "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
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

        // Default error message
        return "No se pudo crear la cuenta. Por favor, intenta nuevamente.";
    };

    const handleSignUp = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert("Error", "Por favor completa todos los campos");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
            return;
        }

        // Reset error states
        setAuthError(null);
        setSignUpSuccess(false);
        setProfileError(null);
        setRetryCount(0);

        setLoading(true);
        try {
            await authClient.signUp.email({
                email: email.trim(),
                password,
                name: name.trim(),
            });
            setSignUpSuccess(true);
            // Session will update reactively, and useEffect will handle profile creation
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            setAuthError(errorMessage);
            const buttons: any[] = [
                {
                    text: "OK",
                    style: "default" as const,
                },
            ];
            
            if (errorMessage.includes("ya está registrado")) {
                buttons.push({
                    text: "Iniciar sesión",
                    style: "default" as const,
                    onPress: () => router.push("/(auth)/sign-in"),
                });
            }
            
            Alert.alert("Error al registrarse", errorMessage, buttons);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Crear cuenta</Text>
                        <Text style={styles.subtitle}>Únete a la comunidad AgroAlva</Text>
                    </View>

                    <View style={styles.form}>
                        {authError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="warning-outline" size={20} color="#D32F2F" />
                                <Text style={styles.errorText}>{authError}</Text>
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#757575" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre completo"
                                placeholderTextColor="#9E9E9E"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!loading}
                            />
                        </View>

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
                                autoComplete="password-new"
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

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar contraseña"
                                placeholderTextColor="#9E9E9E"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                autoComplete="password-new"
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#757575"
                                />
                            </TouchableOpacity>
                        </View>

                        {profileError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
                                <Text style={styles.errorText}>{profileError}</Text>
                            </View>
                        )}

                        {retryCount > 0 && (
                            <View style={styles.infoContainer}>
                                <ActivityIndicator size="small" color="#2E7D32" />
                                <Text style={styles.infoText}>
                                    Creando perfil... (intento {retryCount}/3)
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Registrarse</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/sign-in")}
                                disabled={loading}
                            >
                                <Text style={styles.footerLink}>Inicia sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
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
        backgroundColor: "#FFF3E0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FFB74D",
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: "#E65100",
        marginLeft: 8,
        lineHeight: 18,
    },
    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E8F5E9",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 13,
        color: "#2E7D32",
        marginLeft: 8,
        fontWeight: "500",
    },
});

