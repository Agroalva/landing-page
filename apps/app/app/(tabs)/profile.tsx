import React, { useEffect } from "react";
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
import { useRouter, Redirect } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ConvexImage } from "@/components/ConvexImage";

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const profile = useQuery(api.users.getMe);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const { pickImage, uploading: uploadingAvatar } = useFileUpload();
  
  // Get userId from profile (most reliable) or fallback to user object
  // Only query products when we have a valid userId
  const userId = profile?.userId;
  
  const userProducts = useQuery(
    api.products.byUser,
    userId ? { userId, limit: 10 } : "skip"
  );

  // Ensure profile exists if user is authenticated but profile is missing
  useEffect(() => {
    if (isAuthenticated && user && profile === null) {
      ensureProfile().catch((error) => {
        console.error("Failed to ensure profile:", error);
      });
    }
  }, [isAuthenticated, user, profile, ensureProfile]);

  const handleChangeAvatar = async () => {
    try {
      const storageId = await pickImage();
      if (storageId) {
        await updateProfile({ avatarId: storageId });
        Alert.alert("Éxito", "Avatar actualizado correctamente");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo actualizar el avatar");
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await authClient.signOut();
              router.replace("/(auth)/sign-in");
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangeAvatar}
            disabled={uploadingAvatar}
          >
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
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>
            {profile?.displayName || user?.name || "Usuario"}
          </Text>
          {profile?.bio && <Text style={styles.userRole}>{profile.bio}</Text>}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Editar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="share-outline" size={20} color="#2E7D32" />
              <Text style={styles.secondaryButtonText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Information */}
        {user?.email && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de contacto</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="mail" size={20} color="#757575" />
                <Text style={styles.infoText}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProducts?.length || 0}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
        </View>

        {/* My Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis publicaciones</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

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

        {/* Menu Options */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="heart-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Favoritos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Ayuda y soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={22} color="#F44336" />
              <Text style={[styles.menuText, { color: "#F44336" }]}>
                Cerrar sesión
              </Text>
            </View>
          </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
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
    position: "relative",
    marginBottom: 16,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
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
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#212121",
    marginLeft: 12,
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
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
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
  listingPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  listingFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    backgroundColor: "#4CAF5020",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeSold: {
    backgroundColor: "#75757520",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  statusTextSold: {
    color: "#757575",
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#212121",
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
});

