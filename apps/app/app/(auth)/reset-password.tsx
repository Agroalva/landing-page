import { useEffect, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { authClient } from "@/lib/auth-client";

type Params = {
    token?: string;
    error?: string;
};

export default function ResetPasswordScreen() {
    const { token, error } = useLocalSearchParams<Params>();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (error) {
            Alert.alert(
                "Enlace inválido",
                "El enlace de restablecimiento no es válido o ha expirado.",
            );
        }
    }, [error]);

    const handleResetPassword = async () => {
        if (!token || typeof token !== "string") {
            Alert.alert("Error", "Falta el token de restablecimiento.");
            return;
        }

        if (!password || password.length < 8) {
            Alert.alert(
                "Contraseña muy corta",
                "La contraseña debe tener al menos 8 caracteres.",
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("No coinciden", "Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await authClient.resetPassword({
                newPassword: password,
                token,
            });

            if (error) {
                Alert.alert(
                    "Error",
                    error.message ??
                        "No se pudo restablecer la contraseña. Intenta nuevamente.",
                );
                return;
            }

            Alert.alert(
                "Contraseña actualizada",
                "Tu contraseña ha sido restablecida correctamente.",
                [
                    {
                        text: "Ir a iniciar sesión",
                        onPress: () => router.replace("/(auth)/sign-in"),
                    },
                ],
            );
        } catch (err) {
            console.error("Error resetting password", err);
            Alert.alert(
                "Error",
                "No se pudo restablecer la contraseña. Intenta nuevamente.",
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
                    <Text style={styles.title}>Restablecer contraseña</Text>
                    <View style={styles.headerRightPlaceholder} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.description}>
                        Ingresa una nueva contraseña para tu cuenta.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#757575"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Nueva contraseña"
                            placeholderTextColor="#9E9E9E"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            autoComplete="password-new"
                            editable={!loading}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#757575"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar contraseña"
                            placeholderTextColor="#9E9E9E"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                            autoComplete="password-new"
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={handleResetPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Restablecer contraseña"
                        accessibilityState={{ disabled: loading }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Guardar nueva contraseña</Text>
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

