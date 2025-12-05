import { useState, useEffect, useRef } from "react";
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
    const [nameError, setNameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const { isAuthenticated, isLoading } = useAuthSession();
    const emailInputRef = useRef<TextInput | null>(null);
    const passwordInputRef = useRef<TextInput | null>(null);
    const confirmPasswordInputRef = useRef<TextInput | null>(null);

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
        // Reset error states
        setAuthError(null);
        setNameError(null);
        setEmailError(null);
        setPasswordError(null);
        setConfirmPasswordError(null);
        setSignUpSuccess(false);
        setProfileError(null);
        setRetryCount(0);

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        let hasError = false;

        if (!trimmedName) {
            setNameError("Ingresa tu nombre completo.");
            hasError = true;
        }
        if (!trimmedEmail) {
            setEmailError("Ingresa tu correo electrónico.");
            hasError = true;
        }
        if (!password.trim()) {
            setPasswordError("Ingresa una contraseña.");
            hasError = true;
        }
        if (!confirmPassword.trim()) {
            setConfirmPasswordError("Confirma tu contraseña.");
            hasError = true;
        }
        if (password && confirmPassword && password !== confirmPassword) {
            setPasswordError("Las contraseñas no coinciden.");
            setConfirmPasswordError("Las contraseñas no coinciden.");
            hasError = true;
        }
        if (password && password.length < 6) {
            setPasswordError("La contraseña debe tener al menos 6 caracteres.");
            hasError = true;
        }

        if (hasError) {
            setAuthError("Por favor corrige los campos marcados en rojo.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await authClient.signUp.email({
                email: trimmedEmail,
                password,
                name: trimmedName,
            });

            if (error) {
                const errorMessage = getErrorMessage(error);
                setAuthError(errorMessage);
                return;
            }

            setSignUpSuccess(true);
            // Session will update reactively, and useEffect will handle profile creation
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            setAuthError(errorMessage);
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
                        {signUpSuccess && !authError && (
                            <View style={styles.successContainer}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
                                <Text style={styles.successText}>
                                    Cuenta creada correctamente. Te estamos redirigiendo a AgroAlva.
                                </Text>
                            </View>
                        )}

                        {authError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="warning-outline" size={20} color="#C62828" />
                                <Text style={styles.errorText}>{authError}</Text>
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#757575" style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    nameError && styles.inputError,
                                ]}
                                placeholder="Nombre completo"
                                placeholderTextColor="#9E9E9E"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!loading}
                                returnKeyType="next"
                                onSubmitEditing={() => emailInputRef.current?.focus()}
                            />
                        </View>
                        {nameError && (
                            <Text style={styles.fieldErrorText}>{nameError}</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#757575" style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    emailError && styles.inputError,
                                ]}
                                placeholder="Correo electrónico"
                                placeholderTextColor="#9E9E9E"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                editable={!loading}
                                ref={emailInputRef}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                            />
                        </View>
                        {emailError && (
                            <Text style={styles.fieldErrorText}>{emailError}</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    passwordError && styles.inputError,
                                ]}
                                placeholder="Contraseña (mín. 6 caracteres)"
                                placeholderTextColor="#9E9E9E"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoComplete="password-new"
                                editable={!loading}
                                ref={passwordInputRef}
                                returnKeyType="next"
                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#757575"
                                />
                            </TouchableOpacity>
                        </View>
                        {passwordError && (
                            <Text style={styles.fieldErrorText}>{passwordError}</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    confirmPasswordError && styles.inputError,
                                ]}
                                placeholder="Confirmar contraseña"
                                placeholderTextColor="#9E9E9E"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                autoComplete="password-new"
                                editable={!loading}
                                ref={confirmPasswordInputRef}
                                returnKeyType="done"
                                onSubmitEditing={handleSignUp}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#757575"
                                />
                            </TouchableOpacity>
                        </View>
                        {confirmPasswordError && (
                            <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                        )}

                        {profileError && (
                            <View style={styles.warningContainer}>
                                <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
                                <Text style={styles.warningText}>{profileError}</Text>
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            await ensureProfile();
                                            setProfileError(null);
                                        } catch (e) {
                                            // Se mantendrá el mensaje existente si falla
                                        }
                                    }}
                                    style={styles.retryProfileButton}
                                >
                                    <Text style={styles.retryProfileText}>Reintentar ahora</Text>
                                </TouchableOpacity>
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
                            accessibilityRole="button"
                            accessibilityLabel="Crear cuenta"
                            accessibilityState={{ disabled: loading }}
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
                                accessibilityRole="button"
                                accessibilityLabel="Ir a la pantalla de inicio de sesión"
                            >
                                <Text style={styles.footerLink}>Inicia sesión</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.termsText}>
                            Al registrarte aceptas nuestros{" "}
                            <Text
                                style={styles.termsLink}
                                onPress={() =>
                                    Alert.alert(
                                        "Términos y privacidad",
                                        "Los términos de servicio y la política de privacidad estarán disponibles dentro de la app."
                                    )
                                }
                            >
                                Términos de servicio
                            </Text>{" "}
                            y{" "}
                            <Text
                                style={styles.termsLink}
                                onPress={() =>
                                    Alert.alert(
                                        "Términos y privacidad",
                                        "Los términos de servicio y la política de privacidad estarán disponibles dentro de la app."
                                    )
                                }
                            >
                                Política de privacidad
                            </Text>
                            .
                        </Text>
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
    inputError: {
        borderColor: "#E53935",
    },
    eyeIcon: {
        padding: 8,
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
    fieldErrorText: {
        fontSize: 12,
        color: "#C62828",
        marginBottom: 8,
        marginLeft: 4,
    },
    warningContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FFB74D",
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: "#E65100",
        marginLeft: 8,
        lineHeight: 18,
    },
    retryProfileButton: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: "#FFE0B2",
    },
    retryProfileText: {
        fontSize: 12,
        color: "#E65100",
        fontWeight: "600",
    },
    successContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F5E9",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#A5D6A7",
    },
    successText: {
        flex: 1,
        fontSize: 13,
        color: "#2E7D32",
        marginLeft: 8,
        lineHeight: 18,
    },
    termsText: {
        fontSize: 12,
        color: "#757575",
        textAlign: "center",
        marginTop: 16,
    },
    termsLink: {
        color: "#2E7D32",
        fontWeight: "600",
    },
});

