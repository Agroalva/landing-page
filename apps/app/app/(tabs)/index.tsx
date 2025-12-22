import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuthSession } from "@/hooks/use-session";
import { ConvexImage } from "@/components/ConvexImage";
import {
  CategoryId,
  FamilyId,
  getFamilies,
} from "../config/taxonomy";
import { formatPrice } from "../../utils/currency";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const listRef = useRef<FlatList<any>>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const families = useMemo(() => getFamilies(), []);
  const [selectedFamilyId, setSelectedFamilyId] = useState<FamilyId | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);

  const selectedFamily = selectedFamilyId === "all"
    ? null
    : families.find((family) => family.id === selectedFamilyId) ?? null;

  const availableCategories = selectedFamily?.categories ?? [];
  const selectedCategory = selectedCategoryId
    ? availableCategories.find((category) => category.id === selectedCategoryId) ?? null
    : null;

  // Query with pagination
  const feedResult = useQuery(
    api.products.feed,
    isAuthenticated
      ? { 
          paginationOpts: { 
            numItems: 20, 
            cursor: cursor 
          },
          familyId: selectedFamily?.id,
          categoryId: selectedCategory?.id,
        }
      : "skip"
  );
  const unreadNotificationCount = useQuery(
    api.notifications.getUnreadCount,
    isAuthenticated ? {} : "skip"
  );
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const resetFeedState = useCallback(() => {
    setCursor(null);
    setIsLoadingMore(false);
    setAllProducts([]);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, []);

  const handleSelectFamily = useCallback((familyId: FamilyId | "all") => {
    setSelectedFamilyId(familyId);
    setSelectedCategoryId(null);
    resetFeedState();
  }, [resetFeedState]);

  const handleSelectCategory = useCallback((category: CategoryId | null) => {
    setSelectedCategoryId(category);
    resetFeedState();
  }, [resetFeedState]);

  const listingTitle = useMemo(() => {
    if (selectedFamily) {
      if (selectedCategory) {
        return `${selectedFamily.label} · ${selectedCategory.label}`;
      }
      return `Publicaciones · ${selectedFamily.label}`;
    }
    return "Publicaciones Recientes";
  }, [selectedFamily, selectedCategory]);

  // Update accumulated products when new page loads
  // Convex queries are real-time, so data updates automatically
  useEffect(() => {
    if (feedResult) {
      if (cursor === null) {
        // First page - replace all products
        // Real-time updates will automatically refresh the list
        setAllProducts(feedResult.page);
      } else {
        // Append new page for infinite scroll
        setAllProducts(prev => {
          // Avoid duplicates by checking if product already exists
          const existingIds = new Set(prev.map(p => p._id));
          const newProducts = feedResult.page.filter(p => !existingIds.has(p._id));
          return [...prev, ...newProducts];
        });
      }
      setIsLoadingMore(false);
    }
  }, [feedResult, cursor]);

  // Get favorite status for all products (only when authenticated)
  const productIds = useMemo(() => allProducts.map(p => p._id) || [], [allProducts]);
  const favoritesMap = useQuery(
    api.favorites.getFavoritesMap,
    isAuthenticated && productIds.length > 0 ? { productIds } : "skip"
  );

  // Create a map for quick lookup
  const isFavoriteMap = useMemo(() => {
    const map = new Map<Id<"products">, boolean>();
    favoritesMap?.forEach(({ productId, isFavorite }) => {
      map.set(productId, isFavorite);
    });
    return map;
  }, [favoritesMap]);

  // Handle load more (infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (feedResult && !feedResult.isDone && !isLoadingMore) {
      setIsLoadingMore(true);
      setCursor(feedResult.continueCursor);
    }
  }, [feedResult, isLoadingMore]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Render product item
  const renderProductItem = ({ item: product }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${product._id}`)}
    >
      {product.mediaIds && product.mediaIds.length > 0 ? (
        <ConvexImage
          storageId={product.mediaIds[0]}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={48} color="#9E9E9E" />
        </View>
      )}
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.name}
          </Text>
          <TouchableOpacity
            onPress={async (e) => {
              e.stopPropagation();
              try {
                await toggleFavorite({ productId: product._id });
              } catch (error) {
                console.error("Failed to toggle favorite:", error);
              }
            }}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={
                isFavoriteMap.get(product._id)
                  ? "heart"
                  : "heart-outline"
              }
              size={22}
              color={
                isFavoriteMap.get(product._id) ? "#F44336" : "#2E7D32"
              }
            />
          </TouchableOpacity>
        </View>
        {product.price && (
          <Text style={styles.productPrice}>
            {formatPrice(product.price, product.currency)}
          </Text>
        )}
        <View style={styles.productFooter}>
          <View style={styles.locationContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#757575"
            />
            <Text style={styles.locationText}>
              {new Date(product.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {product.type === "rent" ? "Servicios" : "Venta"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // List header component
  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => router.push("/(tabs)/search")}
        activeOpacity={0.7}
      >
        <Ionicons
          name="search"
          size={20}
          color="#9E9E9E"
          style={styles.searchIcon}
        />
        <Text style={styles.searchInputPlaceholder}>
          Buscar productos, servicios...
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: "/(tabs)/search",
              params: { showFilters: "true" },
            });
          }}
        >
          <Ionicons name="options-outline" size={20} color="#2E7D32" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Family Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Familias</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            key="all"
            style={[
              styles.categoryPill,
              selectedFamilyId === "all" ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => handleSelectFamily("all")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="apps"
              size={16}
              color={selectedFamilyId === "all" ? "#FFFFFF" : "#2E7D32"}
              style={styles.categoryPillIcon}
            />
            <Text
              style={[
                styles.categoryPillText,
                selectedFamilyId === "all" ? { color: "#FFFFFF" } : { color: "#212121" },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          {families.map((family) => {
            const isSelected = selectedFamilyId === family.id;
            return (
              <TouchableOpacity
                key={family.id}
                style={[
                  styles.categoryPill,
                  isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                ]}
                onPress={() => handleSelectFamily(family.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={family.icon as any}
                  size={16}
                  color={isSelected ? "#FFFFFF" : family.color}
                  style={styles.categoryPillIcon}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected ? { color: "#FFFFFF" } : { color: "#212121" },
                  ]}
                >
                  {family.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedFamily && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías de {selectedFamily.label}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity
              key="all-categories"
              style={[
                styles.categoryPill,
                !selectedCategory ? styles.categoryPillActive : styles.categoryPillInactive,
              ]}
              onPress={() => handleSelectCategory(null)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid"
                size={16}
                color={!selectedCategory ? "#FFFFFF" : "#2E7D32"}
                style={styles.categoryPillIcon}
              />
              <Text
                style={[
                  styles.categoryPillText,
                  !selectedCategory ? { color: "#FFFFFF" } : { color: "#212121" },
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>
            {availableCategories.map((category) => {
              const isSelected = selectedCategory?.id === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPill,
                    isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                  ]}
                  onPress={() => handleSelectCategory(category.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={isSelected ? "#FFFFFF" : category.color}
                    style={styles.categoryPillIcon}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected ? { color: "#FFFFFF" } : { color: "#212121" },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Featured Banner */}
      <View style={styles.bannerContainer}>
        <TouchableOpacity
          style={styles.banner}
          onPress={() => {
            handleSelectFamily("agricultural_machinery");
            handleSelectCategory("seeders" as CategoryId);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>🌾 Temporada de Siembra</Text>
            <Text style={styles.bannerSubtitle}>
              Encuentra las mejores semillas para tu cosecha
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#FBC02D" />
        </TouchableOpacity>
      </View>

      {/* Products Section Header */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {listingTitle}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const searchParams: Record<string, string> = {};
              if (selectedFamily) {
                searchParams.familyId = selectedFamily.id;
              }
              if (selectedCategory) {
                searchParams.categoryId = selectedCategory.id;
              }
              router.push({
                pathname: "/(tabs)/search",
                params: Object.keys(searchParams).length > 0 ? searchParams : undefined,
              });
            }}
          >
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // List footer component (loading indicator for load more)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#2E7D32" />
      </View>
    );
  };

  // List empty component
  const renderEmpty = () => {
    if (feedResult === undefined) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#E0E0E0" />
        <Text style={styles.emptyTitle}>No hay productos</Text>
        <Text style={styles.emptySubtitle}>
          Sé el primero en compartir algo
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Agroalva</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color="#2E7D32" />
          {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={allProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/create-post")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  notificationButton: {
    padding: 4,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#F44336",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#212121",
  },
  searchInputPlaceholder: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#9E9E9E",
  },
  favoriteButton: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingHorizontal: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 999,
    maxWidth: 220,
    borderWidth: 1,
  },
  categoryPillIcon: {
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  categoryPillInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 150,
  },
  categoryPillCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryPillCountText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banner: {
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#E0E0E0",
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginRight: 8,
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 13,
    color: "#757575",
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: "#FBC02D20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#F57F17",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: "center",
  },
});

