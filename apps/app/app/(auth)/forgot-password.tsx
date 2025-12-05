import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            Alert.alert("Correo requerido", "Ingresa tu correo electrónico.");
            return;
        }

        setLoading(true);
        try {
            // Better Auth will trigger our sendResetPassword handler on the server
            await authClient.requestPasswordReset({
                email: trimmedEmail,
                redirectTo: "app://reset-password",
            });

            Alert.alert(
                "Revisa tu correo",
                "Si existe una cuenta con este correo, te enviaremos un enlace para restablecer tu contraseña.",
            );

            router.back();
        } catch (error) {
            console.error("Error requesting password reset", error);
            Alert.alert(
                "Error",
                "No se pudo procesar la solicitud. Intenta nuevamente más tarde.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        accessibilityRole="button"
                        accessibilityLabel="Volver"
                    >
                        <Ionicons name="arrow-back" size={24} color="#212121" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Recuperar contraseña</Text>
                    <View style={styles.headerRightPlaceholder} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.description}>
                        Ingresa el correo electrónico asociado a tu cuenta y te enviaremos
                        un enlace para restablecer tu contraseña.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#757575"
                            style={styles.inputIcon}
                        />
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
                            returnKeyType="done"
                            onSubmitEditing={handleRequestReset}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRequestReset}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Enviar enlace de restablecimiento"
                        accessibilityState={{ disabled: loading }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Enviar enlace</Text>
                        )}
                    </TouchableOpacity>
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
        paddingTop: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 32,
    },
    backButton: {
        padding: 4,
    },
    headerRightPlaceholder: {
        width: 24,
        height: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#212121",
    },
    form: {
        width: "100%",
    },
    description: {
        fontSize: 14,
        color: "#616161",
        marginBottom: 24,
        lineHeight: 20,
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
});

