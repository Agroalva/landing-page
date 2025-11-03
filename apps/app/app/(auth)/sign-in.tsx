import { useState } from "react";
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
import { router } from "expo-router";

export default function SignInScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Por favor completa todos los campos");
            return;
        }

        setLoading(true);
        try {
            await authClient.signIn.email({
                email: email.trim(),
                password,
            });
            router.replace("/(tabs)");
        } catch (error: any) {
            Alert.alert(
                "Error",
                error?.message || "No se pudo iniciar sesión. Verifica tus credenciales."
            );
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
});

