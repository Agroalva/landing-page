import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ConvexImage } from "./ConvexImage";
import { formatPrice } from "../utils/currency";
import { Id } from "../convex/_generated/dataModel";
import { getCategoryById } from "../app/config/taxonomy";
import { CONDITION_OPTIONS } from "../app/config/options";

interface ListingCardProps {
  product: {
    _id: Id<"products">;
    name: string;
    price?: number;
    currency?: string;
    type: "rent" | "sell";
    mediaIds?: Id<"_storage">[];
    categoryId?: string;
    category?: string;
    location?: {
      label?: string;
      address?: string;
      latitude: number;
      longitude: number;
    };
    attributes?: Record<string, any>;
    createdAt: number;
  };
  onPress?: () => void;
}

export function ListingCard({ product, onPress }: ListingCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product._id}`);
    }
  };

  const categoryLabel = product.categoryId
    ? getCategoryById(product.categoryId)?.label || product.category
    : product.category || "Sin categoría";

  const conditionValue =
    product.type === "sell" && product.attributes?.condition
      ? CONDITION_OPTIONS.find((opt) => opt.id === product.attributes?.condition)?.label
      : null;

  const locationLabel = product.location?.label || product.location?.address;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.mediaIds && product.mediaIds.length > 0 ? (
          <ConvexImage
            storageId={product.mediaIds[0]}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#9E9E9E" />
          </View>
        )}
        {/* Type Badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {product.type === "rent" ? "Servicio" : "Venta"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price */}
        {product.price && (
          <Text style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </Text>
        )}

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {categoryLabel && (
            <View style={styles.tag}>
              <Ionicons name="pricetag-outline" size={12} color="#757575" />
              <Text style={styles.tagText}>{categoryLabel}</Text>
            </View>
          )}
          {conditionValue && (
            <View style={styles.tag}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#757575" />
              <Text style={styles.tagText}>{conditionValue}</Text>
            </View>
          )}
        </View>

        {/* Location */}
        {locationLabel && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#757575" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#757575",
    flex: 1,
  },
});

