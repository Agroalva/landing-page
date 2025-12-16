import React, { Component, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";
import { ListingCard } from "@/components/ListingCard";

class FavoritesErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Error rendering Favorites screen:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              // Fallback: rely on router.back via global router in screen
              onPress={() => {
                // No router here; prefer user reopening via navigation
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Favoritos</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Ionicons name="warning-outline" size={40} color="#F44336" />
            <Text style={styles.emptyText}>Ocurrió un error al cargar tus favoritos</Text>
            <Text style={styles.emptySubtext}>
              Intenta volver a abrir esta sección o revisa tu conexión a internet.
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

function FavoritesScreenContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const favorites = useQuery(api.favorites.listFavoriteProducts, { limit: 100 });
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  if (isLoading) {
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

  const handleToggleFavorite = async (productId: string) => {
    try {
      await toggleFavorite({ productId: productId as any });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
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
        <Text style={styles.headerTitle}>Favoritos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {favorites === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2E7D32" />
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No tienes favoritos aún</Text>
            <Text style={styles.emptySubtext}>
              Los productos que marques como favoritos aparecerán aquí
            </Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            {favorites.map(({ favoriteId, product }) => (
              <ListingCard
                key={favoriteId}
                product={product}
                onPress={() => router.push(`/product/${product._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function FavoritesScreen() {
  return (
    <FavoritesErrorBoundary>
      <FavoritesScreenContent />
    </FavoritesErrorBoundary>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
  productsContainer: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  productImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productDate: {
    fontSize: 12,
    color: "#757575",
  },
  typeBadge: {
    backgroundColor: "#2E7D3220",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
});

