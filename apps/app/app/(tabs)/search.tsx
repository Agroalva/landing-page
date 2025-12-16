import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CategoryId,
  FamilyId,
  getFamilies,
} from "../config/taxonomy";
import { ListingCard } from "../../components/ListingCard";

const RECENT_SEARCHES_KEY = "@agroalva_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ familyId?: string; categoryId?: string }>();
  const families = useMemo(() => getFamilies(), []);
  const [selectedFamilyId, setSelectedFamilyId] = useState<FamilyId | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const selectedFamily = selectedFamilyId === "all"
    ? null
    : families.find((family) => family.id === selectedFamilyId) ?? null;
  const availableCategories = selectedFamily?.categories ?? [];
  const selectedCategory = selectedCategoryId
    ? availableCategories.find((category) => category.id === selectedCategoryId) ?? null
    : null;

  const handleSelectFamily = (familyId: FamilyId | "all") => {
    setSelectedFamilyId(familyId);
    setSelectedCategoryId(null);
  };

  const handleSelectCategory = (categoryId: CategoryId | null) => {
    setSelectedCategoryId(categoryId);
  };

  // Set initial filters from route params
  useEffect(() => {
    if (params.familyId && typeof params.familyId === "string") {
      setSelectedFamilyId(params.familyId as FamilyId);
    }
    if (params.categoryId && typeof params.categoryId === "string") {
      const categoryId = params.categoryId as CategoryId;
      setSelectedCategoryId(categoryId);
      if (!params.familyId) {
        const matchedFamily = families.find((family) =>
          family.categories.some((category) => category.id === categoryId),
        );
        if (matchedFamily) {
          setSelectedFamilyId(matchedFamily.id);
        }
      }
    }
  }, [params.familyId, params.categoryId, families]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounce search query to avoid querying on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Save search to recent searches when user searches
  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      saveRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        setRecentSearches(Array.isArray(searches) ? searches : []);
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 3) return;

      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let searches: string[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      searches = searches.filter(s => s.toLowerCase() !== trimmedQuery.toLowerCase());
      // Add to beginning
      searches.unshift(trimmedQuery);
      // Keep only MAX_RECENT_SEARCHES
      searches = searches.slice(0, MAX_RECENT_SEARCHES);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
  };

  const handleClearRecentSearches = () => {
    Alert.alert(
      "Limpiar búsquedas",
      "¿Estás seguro de que quieres eliminar todas las búsquedas recientes?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpiar", style: "destructive", onPress: clearRecentSearches },
      ]
    );
  };

  const results = useQuery(
    api.search.querySearch,
    debouncedQuery.length >= 3 
      ? { 
          query: debouncedQuery, 
          familyId: selectedFamily?.id,
          categoryId: selectedCategory?.id,
          limit: 20 
        } 
      : "skip"
  );

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
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView>
        {/* Family Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            <TouchableOpacity
              key="all"
              style={[
                styles.filterChip,
                selectedFamilyId === "all" && styles.filterChipActive,
              ]}
              onPress={() => handleSelectFamily("all")}
            >
              <Ionicons
                name="apps"
                size={18}
                color={selectedFamilyId === "all" ? "#FFFFFF" : "#2E7D32"}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFamilyId === "all" && styles.filterTextActive,
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
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}
                  onPress={() => handleSelectFamily(family.id)}
                >
                  <Ionicons
                    name={family.icon as any}
                    size={18}
                    color={isSelected ? "#FFFFFF" : family.color}
                    style={styles.filterIcon}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextActive,
                    ]}
                  >
                    {family.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Filters */}
        {selectedFamily && (
          <View style={styles.filtersWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              <TouchableOpacity
                key="all-categories"
                style={[
                  styles.filterChip,
                  !selectedCategory && styles.filterChipActive,
                ]}
                onPress={() => handleSelectCategory(null)}
              >
                <Ionicons
                  name="grid"
                  size={18}
                  color={!selectedCategory ? "#FFFFFF" : "#2E7D32"}
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterText,
                    !selectedCategory && styles.filterTextActive,
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
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                    ]}
                    onPress={() => handleSelectCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={18}
                      color={isSelected ? "#FFFFFF" : category.color}
                      style={styles.filterIcon}
                    />
                    <Text
                      style={[
                        styles.filterText,
                        isSelected && styles.filterTextActive,
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

        {/* Search Results */}
        {debouncedQuery.length >= 3 && (
          <View style={styles.section}>
            {results === undefined ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
              </View>
            ) : (
              <>
                {results.products.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Productos</Text>
                    <View style={styles.productsContainer}>
                      {results.products.map((product) => (
                        <ListingCard key={product._id} product={product} />
                      ))}
                    </View>
                  </>
                )}
                {results.profiles.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Perfiles</Text>
                    {results.profiles.map((profile) => (
                      <TouchableOpacity
                        key={profile._id}
                        style={styles.recentItem}
                        onPress={() => router.push(`/user-profile/${profile.userId}`)}
                      >
                        <Ionicons name="person-outline" size={20} color="#757575" />
                        <Text style={styles.recentText}>
                          {profile.displayName}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#9E9E9E" />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {results.products.length === 0 && results.profiles.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyText}>No se encontraron resultados</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Recent Searches - Show when no search query */}
        {!searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={handleClearRecentSearches}>
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>
            {isLoadingRecent ? (
              <ActivityIndicator size="small" color="#2E7D32" style={styles.loadingRecent} />
            ) : recentSearches.length > 0 ? (
              recentSearches.map((search, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.recentItem}
                  onPress={() => handleRecentSearchPress(search)}
                >
                  <Ionicons name="time-outline" size={20} color="#757575" />
                  <Text style={styles.recentText}>{search}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyRecentText}>No hay búsquedas recientes</Text>
              </View>
            )}
          </View>
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
  filtersWrapper: {
    marginBottom: 8,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  clearText: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "600",
  },
  loadingRecent: {
    padding: 20,
  },
  emptyRecent: {
    padding: 20,
    alignItems: "center",
  },
  emptyRecentText: {
    fontSize: 14,
    color: "#757575",
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
  },
  productsContainer: {
    marginTop: 12,
  },
});

