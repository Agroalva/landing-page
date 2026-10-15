import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FieldPulse } from "@/components/FieldPulse";

export default function FieldPulseScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
                    accessibilityRole="button"
                    accessibilityLabel="Volver al inicio"
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1B5E20" />
                </Pressable>
                <Text style={styles.title} accessibilityRole="header">Pulso del campo</Text>
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <Text style={styles.subtitle}>El clima de tu zona y todas las cotizaciones de granos y dólar.</Text>
                <FieldPulse variant="details" />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F1EA" },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFDF8", borderBottomWidth: 1, borderBottomColor: "#E8E0D0" },
    backButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#EDF3E4" },
    title: { flex: 1, fontSize: 22, fontWeight: "800", color: "#1F1A14" },
    content: { padding: 20, paddingBottom: 32, gap: 18 },
    subtitle: { fontSize: 14, lineHeight: 21, color: "#6A5F50" },
});
