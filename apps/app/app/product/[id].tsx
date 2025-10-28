import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

const MOCK_PRODUCT = {
  id: 1,
  title: "Tractor John Deere 5075E",
  price: "$45,000",
  description:
    "Tractor John Deere 5075E en excelente estado. 75 HP, 4x4, con aire acondicionado y cabina cerrada. Ideal para todo tipo de labores agrícolas. Cuenta con mantenimiento al día y todos los documentos en regla.",
  category: "Maquinaria",
  location: "Maracay, Estado Aragua",
  images: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
  ],
  seller: {
    name: "Pedro Ramírez",
    avatar: "https://i.pravatar.cc/150?img=15",
    rating: 4.8,
    verified: true,
    phone: "+58 424-1234567",
  },
  specifications: [
    { label: "Año", value: "2020" },
    { label: "Horas de uso", value: "1,200 hrs" },
    { label: "Potencia", value: "75 HP" },
    { label: "Transmisión", value: "4x4" },
    { label: "Estado", value: "Usado - Excelente" },
  ],
  views: 156,
  favorites: 23,
  postedDate: "Hace 2 días",
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleWhatsApp = () => {
    const phone = MOCK_PRODUCT.seller.phone.replace(/[^0-9]/g, "");
    const message = `Hola, estoy interesado en: ${MOCK_PRODUCT.title}`;
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${MOCK_PRODUCT.seller.phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#F44336" : "#212121"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
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
            {MOCK_PRODUCT.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.productImage}
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicator}>
            {MOCK_PRODUCT.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentImageIndex === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.price}>{MOCK_PRODUCT.price}</Text>
              <Text style={styles.category}>{MOCK_PRODUCT.category}</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={16} color="#757575" />
                <Text style={styles.statText}>{MOCK_PRODUCT.views}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={16} color="#757575" />
                <Text style={styles.statText}>{MOCK_PRODUCT.favorites}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>{MOCK_PRODUCT.title}</Text>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={18} color="#2E7D32" />
            <Text style={styles.location}>{MOCK_PRODUCT.location}</Text>
          </View>

          <Text style={styles.postedDate}>{MOCK_PRODUCT.postedDate}</Text>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{MOCK_PRODUCT.description}</Text>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especificaciones</Text>
            <View style={styles.specificationsContainer}>
              {MOCK_PRODUCT.specifications.map((spec, index) => (
                <View key={index} style={styles.specificationRow}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Map Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={48} color="#9E9E9E" />
              <Text style={styles.mapText}>Mapa de ubicación</Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatarContainer}>
                  <Image
                    source={{ uri: MOCK_PRODUCT.seller.avatar }}
                    style={styles.sellerAvatar}
                  />
                  {MOCK_PRODUCT.seller.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>
                    {MOCK_PRODUCT.seller.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FBC02D" />
                    <Text style={styles.ratingText}>
                      {MOCK_PRODUCT.seller.rating}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.viewProfileButton}>
                <Text style={styles.viewProfileText}>Ver perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          onPress={() => router.push(`/chat/${MOCK_PRODUCT.seller.name}`)}
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
    paddingHorizontal: 16,
    zIndex: 10,
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
});

