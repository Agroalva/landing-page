import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const USER_PROFILE = {
  name: "Pedro Ramírez",
  role: "Productor Agrícola",
  location: "Maracay, Aragua",
  phone: "+58 424-1234567",
  email: "pedro.ramirez@agroalva.com",
  rating: 4.8,
  totalReviews: 24,
  verified: true,
  avatar: "https://i.pravatar.cc/150?img=15",
};

const USER_LISTINGS = [
  {
    id: 1,
    title: "Tractor John Deere 5075E",
    price: "$45,000",
    status: "active",
    views: 156,
  },
  {
    id: 2,
    title: "Semillas de Maíz Híbrido",
    price: "$120/saco",
    status: "active",
    views: 89,
  },
  {
    id: 3,
    title: "Cosechadora Case IH",
    price: "$85,000",
    status: "sold",
    views: 234,
  },
];

export default function ProfileScreen() {
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
          <View style={styles.avatarContainer}>
            <Image source={{ uri: USER_PROFILE.avatar }} style={styles.avatar} />
            {USER_PROFILE.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{USER_PROFILE.name}</Text>
          <Text style={styles.userRole}>{USER_PROFILE.role}</Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FBC02D" />
            <Text style={styles.ratingText}>{USER_PROFILE.rating}</Text>
            <Text style={styles.reviewsText}>
              ({USER_PROFILE.totalReviews} reseñas)
            </Text>
          </View>

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de contacto</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color="#757575" />
              <Text style={styles.infoText}>{USER_PROFILE.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="call" size={20} color="#757575" />
              <Text style={styles.infoText}>{USER_PROFILE.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="mail" size={20} color="#757575" />
              <Text style={styles.infoText}>{USER_PROFILE.email}</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1.2K</Text>
            <Text style={styles.statLabel}>Visitas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
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

          {USER_LISTINGS.map((listing) => (
            <TouchableOpacity key={listing.id} style={styles.listingCard}>
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <Text style={styles.listingPrice}>{listing.price}</Text>
                <View style={styles.listingFooter}>
                  <View
                    style={[
                      styles.statusBadge,
                      listing.status === "sold" && styles.statusBadgeSold,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        listing.status === "sold" && styles.statusTextSold,
                      ]}
                    >
                      {listing.status === "active" ? "Activa" : "Vendida"}
                    </Text>
                  </View>
                  <View style={styles.viewsContainer}>
                    <Ionicons name="eye-outline" size={16} color="#757575" />
                    <Text style={styles.viewsText}>{listing.views} vistas</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          ))}
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

          <TouchableOpacity style={styles.menuItem}>
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
});

