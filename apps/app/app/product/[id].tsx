import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConvexImage } from "@/components/ConvexImage";
import { useAuthSession } from "@/hooks/use-session";
import { formatPrice } from "../../utils/currency";
import { getCategoryById, getFamilyForCategory, getFamilyById } from "../config/taxonomy";
import type { AttributeValueMap } from "../config/taxonomy";
import { CONDITION_OPTIONS } from "../config/options";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.id as Id<"products">;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuthSession();

  const product = useQuery(
    api.products.getById,
    productId ? { productId } : "skip"
  );

  const authorProfile = useQuery(
    api.users.getByUserId,
    product?.authorId ? { userId: product.authorId } : "skip"
  );

  const isFavorite = useQuery(
    api.favorites.isFavorite,
    productId ? { productId } : "skip"
  );

  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const incrementViewCount = useMutation(api.products.incrementViewCount);
  const ensureConversation = useMutation(api.conversations.ensureConversation);
  const deleteProduct = useMutation(api.products.deleteProduct);

  // Check if current user is the author
  const currentUserId = user?.id || user?.userId;
  const isAuthor = currentUserId && product?.authorId === currentUserId;

  const images = product?.mediaIds || [];

  // Increment view count when screen loads
  useEffect(() => {
    if (productId) {
      incrementViewCount({ productId }).catch((error) => {
        console.error("Failed to increment view count:", error);
      });
    }
  }, [productId, incrementViewCount]);

  const handleToggleFavorite = async () => {
    if (!productId) return;
    try {
      await toggleFavorite({ productId });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo actualizar el favorito");
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = authorProfile?.phoneNumber;
    if (!phoneNumber) {
      Alert.alert(
        "WhatsApp",
        "El vendedor no ha proporcionado un número de teléfono"
      );
      return;
    }

    // Format phone number for WhatsApp (remove any non-digit characters except +)
    const formattedNumber = phoneNumber.replace(/[^\d+]/g, "");
    const whatsappUrl = `https://wa.me/${formattedNumber}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert("Error", "No se pudo abrir WhatsApp");
    });
  };

  const handleCall = () => {
    const phoneNumber = authorProfile?.phoneNumber;
    if (!phoneNumber) {
      Alert.alert(
        "Llamar",
        "El vendedor no ha proporcionado un número de teléfono"
      );
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert("Error", "No se pudo realizar la llamada");
    });
  };

  const handleMessage = async () => {
    if (!user || !product?.authorId) {
      Alert.alert("Error", "No se pudo iniciar la conversación");
      return;
    }

    const currentUserId = user.id || user.userId;
    if (!currentUserId) {
      Alert.alert("Error", "No se pudo identificar al usuario");
      return;
    }

    // Don't allow messaging yourself
    if (currentUserId === product.authorId) {
      Alert.alert("Error", "No puedes enviarte un mensaje a ti mismo");
      return;
    }

    try {
      // Ensure conversation exists between current user and product author
      const conversationId = await ensureConversation({
        memberIds: [currentUserId, product.authorId],
      });
      
      // Navigate to chat with conversationId (replace modal)
      router.replace(`/chat/${conversationId}`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo iniciar la conversación");
    }
  };

  const handleShare = async () => {
    if (!product) return;
    
    try {
      const productUrl = `agroalva://product/${product._id}`;
      const shareMessage = `Mira este producto: ${product.name}${product.price ? ` - $${product.price.toLocaleString()}` : ""}\n\n${productUrl}`;
      
      await Share.share({
        message: shareMessage,
        title: product.name,
      });
    } catch (error: any) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "No se pudo compartir el producto");
      }
    }
  };

  const handleDelete = () => {
    if (!productId) return;
    
    Alert.alert(
      "Eliminar publicación",
      "¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct({ productId });
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error?.message || "No se pudo eliminar la publicación");
            }
          },
        },
      ]
    );
  };

  if (product === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (product === null) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Producto no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
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
        <View style={styles.headerRight}>
          {isAuthor && (
            <>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => {
                  router.push({
                    pathname: "/edit-product/[id]",
                    params: { id: productId },
                  });
                }}
              >
                <Ionicons name="create-outline" size={22} color="#212121" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={22} color="#F44336" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#212121" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={isFavorite === undefined}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#F44336" : "#212121"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / width
                  );
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {images.map((storageId, index) => (
                  <ConvexImage
                    key={index}
                    storageId={storageId}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              <View style={styles.imageIndicator}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentImageIndex === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={64} color="#9E9E9E" />
              <Text style={styles.placeholderText}>Sin imágenes</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.postedDate}>
                {new Date(product.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              {product.viewCount !== undefined && product.viewCount > 0 && (
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Ionicons name="eye-outline" size={16} color="#757575" />
                    <Text style={styles.statText}>
                      {product.viewCount} {product.viewCount === 1 ? "vista" : "vistas"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>{product.name}</Text>
          {product.price && (
            <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {product.type === "rent" ? "Servicios" : "Venta"}
            </Text>
          </View>

          {/* Seller Card */}
          {authorProfile && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                {authorProfile.avatarId ? (
                  <ConvexImage
                    storageId={authorProfile.avatarId}
                    style={styles.sellerAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                    <Ionicons name="person" size={24} color="#9E9E9E" />
                  </View>
                )}
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>
                    {authorProfile.displayName}
                  </Text>
                  {authorProfile.bio && (
                    <Text style={styles.statText} numberOfLines={1}>
                      {authorProfile.bio}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={() => {
                  // Replace modal with user profile screen
                  router.replace(`/user-profile/${product.authorId}`);
                }}
              >
                <Text style={styles.viewProfileText}>Ver perfil</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <View style={styles.detailsContainer}>
              {/* Tipo de publicación */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo</Text>
                <Text style={styles.detailValue}>
                  {product.type === "rent" ? "Servicio" : "Producto"}
                </Text>
              </View>

              {/* Categoría */}
              {product.categoryId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoría</Text>
                  <Text style={styles.detailValue}>
                    {getCategoryById(product.categoryId)?.label || product.category || "N/A"}
                  </Text>
                </View>
              )}

              {/* Familia */}
              {product.familyId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Familia</Text>
                  <Text style={styles.detailValue}>
                    {getFamilyById(product.familyId)?.label || "N/A"}
                  </Text>
                </View>
              )}

              {/* Condición - Solo para productos */}
              {product.type === "sell" && product.attributes?.condition && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Condición</Text>
                  <Text style={styles.detailValue}>
                    {CONDITION_OPTIONS.find(
                      (opt) => opt.id === product.attributes?.condition
                    )?.label || String(product.attributes.condition)}
                  </Text>
                </View>
              )}

              {/* Precio */}
              {product.price && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precio</Text>
                  <Text style={styles.detailValue}>
                    {formatPrice(product.price, product.currency)}
                  </Text>
                </View>
              )}

              {/* Ubicación */}
              {product.location && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ubicación</Text>
                  <Text style={styles.detailValue}>
                    {product.location.label || product.location.address || 
                     `${product.location.latitude.toFixed(3)}, ${product.location.longitude.toFixed(3)}`}
                  </Text>
                </View>
              )}

              {/* Otros atributos */}
              {product.attributes && Object.entries(product.attributes).map(([key, value]) => {
                // Skip condition for services (already handled above for products)
                if (key === "condition" && product.type === "rent") {
                  return null;
                }
                // Skip condition if already shown above
                if (key === "condition" && product.type === "sell") {
                  return null;
                }
                // Skip year for services
                if (key === "year" && product.type === "rent") {
                  return null;
                }

                const category = product.categoryId ? getCategoryById(product.categoryId) : null;
                const attributeDef = category?.attributes.find((attr) => attr.id === key);
                const label = attributeDef?.label || key;

                let displayValue: string;
                if (typeof value === "string") {
                  // Try to find option label if it's a select attribute
                  if (attributeDef?.options) {
                    const option = attributeDef.options.find((opt) => opt.id === value);
                    displayValue = option?.label || value;
                  } else {
                    displayValue = value;
                  }
                } else if (typeof value === "number") {
                  displayValue = value.toString();
                } else if (typeof value === "boolean") {
                  displayValue = value ? "Sí" : "No";
                } else if (Array.isArray(value)) {
                  displayValue = value.join(", ");
                } else if (typeof value === "object" && value !== null) {
                  const range = value as { min?: number; max?: number };
                  if (range.min !== undefined && range.max !== undefined) {
                    displayValue = `${range.min} - ${range.max}`;
                  } else if (range.min !== undefined) {
                    displayValue = `Mín: ${range.min}`;
                  } else if (range.max !== undefined) {
                    displayValue = `Máx: ${range.max}`;
                  } else {
                    displayValue = "N/A";
                  }
                } else {
                  displayValue = "N/A";
                }

                return (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{displayValue}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Location */}
          {product.location && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={20} color="#2E7D32" />
                <Text style={styles.location}>
                  {product.location.label || product.location.address || 
                   `${product.location.latitude.toFixed(6)}, ${product.location.longitude.toFixed(6)}`}
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Contact Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Llamar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactButton, styles.whatsappButton]}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactButton, styles.messageButton]}
          onPress={handleMessage}
        >
          <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Mensaje</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageGalleryContainer: {
    position: "relative",
  },
  productImage: {
    width: width,
    height: 400,
    backgroundColor: "#E0E0E0",
  },
  productImagePlaceholder: {
    width: width,
    height: 400,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9E9E9E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: "#757575",
    marginBottom: 20,
  },
  imageIndicator: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF50",
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  contentContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: "#2E7D3220",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  typeBadgeText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  category: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: "#757575",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 15,
    color: "#2E7D32",
    marginLeft: 4,
    fontWeight: "500",
  },
  postedDate: {
    fontSize: 13,
    color: "#9E9E9E",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#424242",
  },
  specificationsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
  },
  specificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  specLabel: {
    fontSize: 14,
    color: "#757575",
  },
  specValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
  },
  sellerCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerAvatarContainer: {
    position: "relative",
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sellerAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F5F5F5",
  },
  sellerDetails: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginLeft: 4,
  },
  viewProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewProfileText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  messageButton: {
    backgroundColor: "#FBC02D",
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  detailsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
});

