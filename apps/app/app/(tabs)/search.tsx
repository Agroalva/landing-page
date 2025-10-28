import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const FILTERS = [
  { id: 1, name: "Todos", icon: "apps" },
  { id: 2, name: "Maquinaria", icon: "construct" },
  { id: 3, name: "Semillas", icon: "leaf" },
  { id: 4, name: "Servicios", icon: "people" },
  { id: 5, name: "Fertilizantes", icon: "flask" },
];

const RECENT_SEARCHES = [
  "Tractor John Deere",
  "Semillas de tomate",
  "Servicio de fumigación",
  "Fertilizante orgánico",
];

export default function SearchScreen() {
  const [selectedFilter, setSelectedFilter] = useState(1);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9E9E9E"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="¿Qué estás buscando?"
          placeholderTextColor="#9E9E9E"
          autoFocus
        />
      </View>

      <ScrollView>
        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon as any}
                size={18}
                color={selectedFilter === filter.id ? "#FFFFFF" : "#2E7D32"}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
          {RECENT_SEARCHES.map((search, index) => (
            <TouchableOpacity key={index} style={styles.recentItem}>
              <Ionicons name="time-outline" size={20} color="#757575" />
              <Text style={styles.recentText}>{search}</Text>
              <Ionicons name="arrow-forward" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías populares</Text>
          <View style={styles.popularGrid}>
            <TouchableOpacity style={styles.popularCard}>
              <View style={[styles.popularIcon, { backgroundColor: "#2E7D3220" }]}>
                <Ionicons name="construct" size={32} color="#2E7D32" />
              </View>
              <Text style={styles.popularText}>Maquinaria</Text>
              <Text style={styles.popularCount}>120+ productos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popularCard}>
              <View style={[styles.popularIcon, { backgroundColor: "#FBC02D20" }]}>
                <Ionicons name="leaf" size={32} color="#F57F17" />
              </View>
              <Text style={styles.popularText}>Semillas</Text>
              <Text style={styles.popularCount}>85+ productos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popularCard}>
              <View style={[styles.popularIcon, { backgroundColor: "#2E7D3220" }]}>
                <Ionicons name="people" size={32} color="#2E7D32" />
              </View>
              <Text style={styles.popularText}>Servicios</Text>
              <Text style={styles.popularCount}>45+ servicios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popularCard}>
              <View style={[styles.popularIcon, { backgroundColor: "#FBC02D20" }]}>
                <Ionicons name="flask" size={32} color="#F57F17" />
              </View>
              <Text style={styles.popularText}>Fertilizantes</Text>
              <Text style={styles.popularCount}>60+ productos</Text>
            </TouchableOpacity>
          </View>
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
  filtersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#212121",
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  popularCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  popularIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  popularText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  popularCount: {
    fontSize: 12,
    color: "#757575",
  },
});

