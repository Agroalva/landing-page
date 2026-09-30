import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { StarRating } from "@/components/StarRating";
import { useAuthSession } from "@/hooks/use-session";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const RATING_LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];

function getErrorMessage(error: any) {
    return error?.data || error?.message || "No se pudo guardar la reseña";
}

export default function ReviewScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const { isAuthenticated, isLoading } = useAuthSession();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [productId, setProductId] = useState<Id<"products"> | undefined>();
    const [isSaving, setIsSaving] = useState(false);
    const initializedReviewId = useRef<string | null>(null);

    const profile = useQuery(
        api.users.getByUserId,
        userId ? { userId } : "skip",
    );
    const eligibility = useQuery(
        api.reviews.getReviewEligibility,
        userId ? { reviewedUserId: userId } : "skip",
    );
    const existingReview = useQuery(
        api.reviews.getMyReviewForUser,
        userId ? { reviewedUserId: userId } : "skip",
    );
    const createReview = useMutation(api.reviews.create);
    const updateReview = useMutation(api.reviews.update);
    const removeReview = useMutation(api.reviews.remove);

    useEffect(() => {
        if (!existingReview || initializedReviewId.current === existingReview._id) {
            return;
        }

        initializedReviewId.current = existingReview._id;
        setRating(existingReview.rating);
        setComment(existingReview.comment);
        setProductId(existingReview.productId);
    }, [existingReview]);

    useEffect(() => {
        if (!existingReview && !productId && eligibility?.products.length === 1) {
            setProductId(eligibility.products[0].productId);
        }
    }, [eligibility, existingReview, productId]);

    const handleSubmit = async () => {
        if (!userId || rating < 1) {
            Alert.alert("Falta la calificación", "Selecciona entre 1 y 5 estrellas.");
            return;
        }
        if (comment.trim().length < 10) {
            Alert.alert("Comentario muy corto", "Escribe al menos 10 caracteres.");
            return;
        }

        setIsSaving(true);
        try {
            if (existingReview) {
                await updateReview({
                    reviewId: existingReview._id,
                    rating,
                    comment,
                    productId,
                });
            } else {
                await createReview({
                    reviewedUserId: userId,
                    rating,
                    comment,
                    productId,
                });
            }
            Alert.alert(
                existingReview ? "Reseña actualizada" : "Reseña publicada",
                "Gracias por compartir tu experiencia en Agroalva.",
                [{ text: "Aceptar", onPress: () => router.back() }],
            );
        } catch (error) {
            Alert.alert("No se pudo guardar", getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = () => {
        if (!existingReview) {
            return;
        }

        Alert.alert(
            "Eliminar reseña",
            "La calificación dejará de formar parte del promedio.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeReview({ reviewId: existingReview._id });
                            router.back();
                        } catch (error) {
                            Alert.alert("Error", getErrorMessage(error));
                        }
                    },
                },
            ],
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </SafeAreaView>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    const isLoadingData = profile === undefined || eligibility === undefined || existingReview === undefined;
    const canCompose = Boolean(existingReview || eligibility?.canReview);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="close" size={26} color="#212121" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {existingReview ? "Editar reseña" : "Calificar usuario"}
                </Text>
                <View style={styles.headerButton} />
            </View>

            {isLoadingData ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            ) : !canCompose ? (
                <View style={styles.ineligibleContainer}>
                    <Ionicons name="chatbubbles-outline" size={56} color="#9E9E9E" />
                    <Text style={styles.ineligibleTitle}>Aún no puedes calificar</Text>
                    <Text style={styles.ineligibleText}>
                        Para proteger la reputación de la comunidad, ambos usuarios deben haber
                        enviado al menos un mensaje en una conversación de Agroalva.
                    </Text>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.secondaryButtonText}>Volver al perfil</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.introCard}>
                            <Ionicons name="shield-checkmark-outline" size={24} color="#2E7D32" />
                            <View style={styles.introContent}>
                                <Text style={styles.introTitle}>Interacción en Agroalva</Text>
                                <Text style={styles.introText}>
                                    Tu reseña será pública en el perfil de {profile?.displayName || "este usuario"}.
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.label}>Tu calificación</Text>
                        <View style={styles.ratingCard}>
                            <StarRating value={rating} onChange={setRating} size={38} />
                            <Text style={styles.ratingLabel}>
                                {rating ? RATING_LABELS[rating] : "Toca una estrella"}
                            </Text>
                        </View>

                        {eligibility && eligibility.products.length > 0 && (
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Publicación relacionada (opcional)</Text>
                                <View style={styles.productOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.productChip,
                                            !productId && styles.productChipSelected,
                                        ]}
                                        onPress={() => setProductId(undefined)}
                                    >
                                        <Text
                                            style={[
                                                styles.productChipText,
                                                !productId && styles.productChipTextSelected,
                                            ]}
                                        >
                                            Sin publicación
                                        </Text>
                                    </TouchableOpacity>
                                    {eligibility.products.map((product) => (
                                        <TouchableOpacity
                                            key={product.productId}
                                            style={[
                                                styles.productChip,
                                                productId === product.productId && styles.productChipSelected,
                                            ]}
                                            onPress={() => setProductId(product.productId)}
                                        >
                                            <Text
                                                style={[
                                                    styles.productChipText,
                                                    productId === product.productId && styles.productChipTextSelected,
                                                ]}
                                            >
                                                {product.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Cuenta tu experiencia</Text>
                            <TextInput
                                style={styles.commentInput}
                                value={comment}
                                onChangeText={setComment}
                                placeholder="Describe la comunicación, el cumplimiento y el trato recibido..."
                                placeholderTextColor="#9E9E9E"
                                multiline
                                maxLength={1000}
                                textAlignVertical="top"
                                accessibilityLabel="Comentario de la reseña"
                            />
                            <Text style={styles.characterCount}>{comment.length}/1000</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (isSaving || rating < 1 || comment.trim().length < 10) &&
                                    styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={isSaving || rating < 1 || comment.trim().length < 10}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {existingReview ? "Guardar cambios" : "Publicar reseña"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {existingReview && (
                            <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                                <Text style={styles.removeButtonText}>Eliminar mi reseña</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F5" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E0E0E0",
    },
    headerButton: { width: 32, padding: 3 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#212121" },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 48 },
    introCard: {
        flexDirection: "row",
        gap: 12,
        backgroundColor: "#E8F5E9",
        borderRadius: 14,
        padding: 16,
        marginBottom: 28,
    },
    introContent: { flex: 1 },
    introTitle: { fontSize: 15, fontWeight: "700", color: "#1B5E20", marginBottom: 3 },
    introText: { fontSize: 13, lineHeight: 18, color: "#33691E" },
    label: { fontSize: 15, fontWeight: "700", color: "#212121", marginBottom: 10 },
    ratingCard: {
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 22,
        marginBottom: 24,
    },
    ratingLabel: { color: "#616161", fontSize: 14, marginTop: 10 },
    fieldGroup: { marginBottom: 24 },
    productOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    productChip: {
        borderWidth: 1,
        borderColor: "#D0D0D0",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#FFFFFF",
    },
    productChipSelected: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
    productChipText: { color: "#616161", fontSize: 13 },
    productChipTextSelected: { color: "#1B5E20", fontWeight: "600" },
    commentInput: {
        minHeight: 150,
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        padding: 14,
        color: "#212121",
        fontSize: 15,
        lineHeight: 21,
    },
    characterCount: { textAlign: "right", color: "#9E9E9E", fontSize: 12, marginTop: 6 },
    submitButton: {
        minHeight: 50,
        borderRadius: 14,
        backgroundColor: "#2E7D32",
        alignItems: "center",
        justifyContent: "center",
    },
    submitButtonDisabled: { backgroundColor: "#A5D6A7" },
    submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    removeButton: { alignItems: "center", padding: 16, marginTop: 8 },
    removeButtonText: { color: "#C62828", fontSize: 14, fontWeight: "600" },
    ineligibleContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 36,
    },
    ineligibleTitle: { fontSize: 20, fontWeight: "700", color: "#212121", marginTop: 16 },
    ineligibleText: { fontSize: 15, lineHeight: 22, color: "#757575", textAlign: "center", marginTop: 8 },
    secondaryButton: {
        borderWidth: 1,
        borderColor: "#2E7D32",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginTop: 24,
    },
    secondaryButtonText: { color: "#2E7D32", fontWeight: "700" },
});
