import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuthSession } from "@/hooks/use-session";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: 1, name: "Maquinaria", icon: "construct", color: "#2E7D32" },
  { id: 2, name: "Semillas", icon: "leaf", color: "#FBC02D" },
  { id: 3, name: "Servicios", icon: "people", color: "#2E7D32" },
  { id: 4, name: "Fertilizantes", icon: "flask", color: "#FBC02D" },
  { id: 5, name: "Transporte", icon: "car", color: "#2E7D32" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const posts = useQuery(api.posts.feed, { limit: 20 });

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>AgroAlva</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9E9E9E"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos, servicios..."
            placeholderTextColor="#9E9E9E"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Categories Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: category.color + "15" },
                ]}
              >
                <Ionicons
                  name={category.icon as any}
                  size={28}
                  color={category.color}
                />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>🌾 Temporada de Siembra</Text>
              <Text style={styles.bannerSubtitle}>
                Encuentra las mejores semillas para tu cosecha
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#FBC02D" />
          </View>
        </View>

        {/* Products List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Publicaciones Recientes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {posts === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No hay publicaciones</Text>
              <Text style={styles.emptySubtitle}>
                Sé el primero en compartir algo
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <TouchableOpacity
                key={post._id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${post._id}`)}
              >
                {post.mediaIds && post.mediaIds.length > 0 ? (
                  <Image
                    source={{ uri: `placeholder-for-${post.mediaIds[0]}` }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color="#9E9E9E" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {post.text}
                    </Text>
                    <TouchableOpacity>
                      <Ionicons
                        name="heart-outline"
                        size={22}
                        color="#2E7D32"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.productFooter}>
                    <View style={styles.locationContainer}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color="#757575"
                      />
                      <Text style={styles.locationText}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

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
  categoryCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 16,
    minWidth: 100,
  },
  categoryName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
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
});

