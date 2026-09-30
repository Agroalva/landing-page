import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";
import { ConvexImage } from "@/components/ConvexImage";
import { StarRating } from "@/components/StarRating";

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string }>();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthSession();
  const profile = useQuery(
    api.users.getByUserId,
    params.userId ? { userId: params.userId } : "skip"
  );
  const userProducts = useQuery(
    api.products.byUser,
    params.userId ? { userId: params.userId, limit: 50 } : "skip"
  );
  const reviewSummary = useQuery(
    api.reviews.getSummaryForUser,
    params.userId ? { userId: params.userId } : "skip"
  );
  const myReview = useQuery(
    api.reviews.getMyReviewForUser,
    params.userId ? { reviewedUserId: params.userId } : "skip"
  );
  const {
    results: reviews,
    status: reviewsStatus,
    loadMore: loadMoreReviews,
  } = usePaginatedQuery(
    api.reviews.listForUser,
    params.userId ? { reviewedUserId: params.userId } : "skip",
    { initialNumItems: 5 }
  );
  const ensureConversation = useMutation(api.conversations.ensureConversation);
  const reportReview = useMutation(api.reviews.report);

  const currentUserId = user?.id || user?.userId;
  const isOwnProfile = currentUserId === params.userId;

  const handleReportReview = (reviewId: (typeof reviews)[number]["_id"]) => {
    const submitReport = async (reason: "spam" | "inappropriate") => {
      try {
        await reportReview({ reviewId, reason });
        Alert.alert("Reporte enviado", "Gracias. Revisaremos esta reseña.");
      } catch (error: any) {
        Alert.alert("Error", error?.data || error?.message || "No se pudo enviar el reporte");
      }
    };

    Alert.alert("Reportar reseña", "Selecciona el motivo del reporte.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Spam", onPress: () => submitReport("spam") },
      { text: "Contenido inapropiado", onPress: () => submitReport("inappropriate") },
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!params.userId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Usuario no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatarId ? (
              <ConvexImage
                storageId={profile.avatarId}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#9E9E9E" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>
            {profile?.displayName || "Usuario"}
          </Text>
          {profile?.bio && <Text style={styles.userBio}>{profile.bio}</Text>}

          <View style={styles.profileRating}>
            {reviewSummary === undefined ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : reviewSummary.count > 0 && reviewSummary.average !== null ? (
              <StarRating
                value={reviewSummary.average}
                reviewCount={reviewSummary.count}
                showValue
                size={19}
              />
            ) : (
              <Text style={styles.noReviewsText}>Sin calificaciones todavía</Text>
            )}
          </View>

          {!isOwnProfile && (
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={async () => {
                  if (!currentUserId || !params.userId) {
                    Alert.alert("Error", "No se pudo iniciar la conversación");
                    return;
                  }

                  try {
                    const conversationId = await ensureConversation({
                      memberIds: [currentUserId, params.userId],
                    });
                    router.push(`/chat/${conversationId}`);
                  } catch (error: any) {
                    Alert.alert("Error", error?.message || "No se pudo iniciar la conversación");
                  }
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Mensaje</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => router.push(`/review/${params.userId}` as any)}
              >
                <Ionicons name={myReview ? "create-outline" : "star-outline"} size={20} color="#2E7D32" />
                <Text style={styles.reviewButtonText}>
                  {myReview ? "Editar reseña" : "Calificar"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProducts?.length || 0}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calificaciones y reseñas</Text>
          {reviewsStatus === "LoadingFirstPage" ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2E7D32" />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.reviewsEmptyState}>
              <Ionicons name="star-outline" size={38} color="#BDBDBD" />
              <Text style={styles.emptyText}>Sin calificaciones todavía</Text>
            </View>
          ) : (
            <>
              {reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <TouchableOpacity
                      style={styles.reviewerInfo}
                      onPress={() => router.push(`/user-profile/${review.reviewer.userId}`)}
                      disabled={review.reviewer.userId === params.userId}
                    >
                      {review.reviewer.avatarId ? (
                        <ConvexImage
                          storageId={review.reviewer.avatarId}
                          style={styles.reviewerAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.reviewerAvatar}>
                          <Ionicons name="person" size={18} color="#9E9E9E" />
                        </View>
                      )}
                      <View style={styles.reviewerText}>
                        <Text style={styles.reviewerName}>{review.reviewer.displayName}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reviewMenuButton}
                      onPress={() => {
                        if (review.reviewer.userId === currentUserId) {
                          router.push(`/review/${params.userId}` as any);
                        } else {
                          handleReportReview(review._id);
                        }
                      }}
                      accessibilityLabel={
                        review.reviewer.userId === currentUserId
                          ? "Editar mi reseña"
                          : "Reportar reseña"
                      }
                    >
                      <Ionicons
                        name={review.reviewer.userId === currentUserId ? "create-outline" : "flag-outline"}
                        size={18}
                        color="#757575"
                      />
                    </TouchableOpacity>
                  </View>
                  <StarRating value={review.rating} size={17} />
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <View style={styles.verifiedInteraction}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#2E7D32" />
                    <Text style={styles.verifiedInteractionText}>Interacción en Agroalva</Text>
                  </View>
                  {review.productName && (
                    <Text style={styles.reviewProduct} numberOfLines={1}>
                      Relacionada con: {review.productName}
                    </Text>
                  )}
                </View>
              ))}
              {reviewsStatus === "CanLoadMore" && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => loadMoreReviews(5)}
                >
                  <Text style={styles.loadMoreText}>Ver más reseñas</Text>
                </TouchableOpacity>
              )}
              {reviewsStatus === "LoadingMore" && (
                <ActivityIndicator size="small" color="#2E7D32" style={styles.loadMoreSpinner} />
              )}
            </>
          )}
        </View>

        {/* User's Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isOwnProfile ? "Mis publicaciones" : "Publicaciones"}
          </Text>

          {userProducts === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2E7D32" />
            </View>
          ) : userProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No hay productos</Text>
            </View>
          ) : (
            userProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.listingCard}
                onPress={() => router.push(`/product/${product._id}`)}
              >
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.listingFooter}>
                    <Text style={styles.viewsText}>
                      {new Date(product.createdAt).toLocaleDateString()}
                    </Text>
                    {product.price && (
                      <Text style={styles.priceText}>
                        ${product.price.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  placeholder: {
    width: 24,
  },
  backButton: {
    padding: 4,
  },
  profileHeader: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  userBio: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  profileRating: {
    minHeight: 28,
    justifyContent: "center",
    marginBottom: 18,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#757575",
  },
  profileActions: {
    flexDirection: "row",
    gap: 10,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 7,
  },
  reviewButtonText: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#757575",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  reviewsEmptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 28,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  reviewerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerText: { marginLeft: 10, flex: 1 },
  reviewerName: { color: "#212121", fontSize: 14, fontWeight: "700" },
  reviewDate: { color: "#9E9E9E", fontSize: 12, marginTop: 2 },
  reviewMenuButton: { padding: 8 },
  reviewComment: { color: "#424242", fontSize: 14, lineHeight: 20, marginTop: 10 },
  verifiedInteraction: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 12,
  },
  verifiedInteractionText: { color: "#2E7D32", fontSize: 12, fontWeight: "600" },
  reviewProduct: { color: "#757575", fontSize: 12, marginTop: 7 },
  loadMoreButton: { alignItems: "center", paddingVertical: 14 },
  loadMoreText: { color: "#2E7D32", fontSize: 14, fontWeight: "700" },
  loadMoreSpinner: { marginVertical: 14 },
  listingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  listingFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewsText: {
    fontSize: 13,
    color: "#757575",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "600",
  },
});
