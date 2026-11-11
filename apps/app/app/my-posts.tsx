import React, { useMemo, useState } from "react";
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
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";
import { ListingCard } from "@/components/ListingCard";
import { ListingStatusActions } from "@/components/ListingStatusActions";
import { getListingStatus, isClosedStatus } from "../config/listing-status";

type PostsFilter = "all" | "active" | "paused" | "closed";

const FILTER_OPTIONS: { id: PostsFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Activas" },
  { id: "paused", label: "Pausadas" },
  { id: "closed", label: "Vendidas / alquiladas" },
];

const EMPTY_FILTER_MESSAGES: Record<Exclude<PostsFilter, "all">, string> = {
  active: "No tenés publicaciones activas",
  paused: "No tenés publicaciones pausadas",
  closed: "No tenés publicaciones vendidas ni alquiladas",
};
import { ListingStatsSummary } from "@/components/ListingStats";

export default function MyPostsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const profile = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );
  const userId = profile?.userId;
  
  const userProducts = useQuery(
    api.products.byUser,
    isAuthenticated && userId ? { userId, limit: 100 } : "skip"
  );
  const [filter, setFilter] = useState<PostsFilter>("all");

  const counts = useMemo(() => {
    const result: Record<PostsFilter, number> = { all: 0, active: 0, paused: 0, closed: 0 };
    for (const product of userProducts ?? []) {
      result.all += 1;
      if (isClosedStatus(product.status)) {
        result.closed += 1;
      } else {
        result[getListingStatus(product.status) as "active" | "paused"] += 1;
      }
    }
    return result;
  }, [userProducts]);

  const visibleProducts = useMemo(() => {
    if (!userProducts || filter === "all") {
      return userProducts;
    }
    return userProducts.filter((product) =>
      filter === "closed"
        ? isClosedStatus(product.status)
        : getListingStatus(product.status) === filter,
    );
  }, [userProducts, filter]);

  // Private stats (only returned for the signed-in author's own listings).
  const listingsStats = useQuery(
    api.productStats.getMyListingsStats,
    isAuthenticated ? {} : "skip"
  );
  const statsByProductId = new Map(
    (listingsStats ?? []).map((stats) => [stats.productId, stats])
  );

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis publicaciones</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {userProducts === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2E7D32" />
          </View>
        ) : userProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No hay productos</Text>
            <Text style={styles.emptySubtext}>
              Crea tu primera publicación para comenzar
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              {FILTER_OPTIONS.map((option) => {
                const isSelected = filter === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                    onPress={() => setFilter(option.id)}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                      {option.label} ({counts[option.id]})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {visibleProducts && visibleProducts.length === 0 && filter !== "all" ? (
              <View style={styles.emptyState}>
                <Ionicons name="filter-outline" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>{EMPTY_FILTER_MESSAGES[filter]}</Text>
              </View>
            ) : (
              <View style={styles.productsContainer}>
                {visibleProducts?.map((product) => (
                  <View key={product._id} style={styles.postItem}>
                    <ListingCard
                      product={product}
                      footer={
                        <ListingStatsSummary
                          stats={statsByProductId.get(product._id)}
                          onPressDetails={() =>
                            router.push({
                              pathname: "/product-stats/[id]",
                              params: { id: product._id },
                            })
                          }
                        />
                      }
                    />
                    <ListingStatusActions
                      productId={product._id}
                      type={product.type}
                      status={product.status}
                      style={styles.postActions}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
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
    paddingTop: 4,
    gap: 16,
  },
  postItem: {
    marginBottom: 8,
  },
  postActions: {
    marginTop: -4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#616161",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
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

