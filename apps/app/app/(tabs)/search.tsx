import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthSession } from "@/hooks/use-session";
import {
  CategoryId,
  FamilyId,
  getCategoryById,
  getFamilies,
} from "../../config/taxonomy";
import { ListingCard } from "../../components/ListingCard";
import { trackSearch } from "@/lib/meta-events";

const RECENT_SEARCHES_KEY = "@agroalva_recent_searches";
const MAX_RECENT_SEARCHES = 10;
const PERSONAL_FAMILY_ID = "personal" as const satisfies FamilyId;
const LEGACY_PERSONAL_CATEGORY_ID = "personal_services" as const satisfies CategoryId;
const VEHICLES_FAMILY_ID = "vehicles" as const satisfies FamilyId;

type TopLevelIntent = "all" | "products" | "services" | "personal";
type PrimaryTopLevelIntent = Exclude<TopLevelIntent, "all">;

const TOP_LEVEL_OPTIONS: {
  id: TopLevelIntent;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}[] = [
  {
    id: "all",
    label: "Todo",
    icon: "apps-outline",
    accent: "#6D4C41",
  },
  {
    id: "personal",
    label: "Personal",
    icon: "people-outline",
    accent: "#8E24AA",
  },
  {
    id: "products",
    label: "Compra y Venta",
    icon: "cube-outline",
    accent: "#1B5E20",
  },
  {
    id: "services",
    label: "Servicios",
    icon: "construct-outline",
    accent: "#0D47A1",
  },
];
const PRIMARY_TOP_LEVEL_ORDER: PrimaryTopLevelIntent[] = [
  "personal",
  "services",
  "products",
];
const ROTATED_PRIMARY_TOP_LEVEL_ORDER: Record<
  PrimaryTopLevelIntent,
  PrimaryTopLevelIntent[]
> = {
  personal: ["personal", "services", "products"],
  services: ["services", "personal", "products"],
  products: ["products", "services", "personal"],
};
const TOP_LEVEL_OPTION_BY_ID = TOP_LEVEL_OPTIONS.reduce(
  (optionsById, option) => ({
    ...optionsById,
    [option.id]: option,
  }),
  {} as Record<TopLevelIntent, (typeof TOP_LEVEL_OPTIONS)[number]>,
);

const getParamValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const parseTopLevelIntent = (value?: string): TopLevelIntent => {
  if (value === "products" || value === "services" || value === "personal") {
    return value;
  }

  return "all";
};

const resolveTopLevelIntent = (topLevel?: string, familyId?: string): TopLevelIntent => {
  if (topLevel === "personal" || familyId === PERSONAL_FAMILY_ID) {
    return "personal";
  }

  return parseTopLevelIntent(topLevel);
};

const getOrderedTopLevelOptions = (selectedTopLevel: TopLevelIntent) => {
  if (selectedTopLevel === "all") {
    return [
      TOP_LEVEL_OPTION_BY_ID.all,
      ...PRIMARY_TOP_LEVEL_ORDER.map((id) => TOP_LEVEL_OPTION_BY_ID[id]),
    ];
  }

  return [
    ...ROTATED_PRIMARY_TOP_LEVEL_ORDER[selectedTopLevel].map(
      (id) => TOP_LEVEL_OPTION_BY_ID[id],
    ),
    TOP_LEVEL_OPTION_BY_ID.all,
  ];
};

const isFamilyVisibleForTopLevel = (familyId: FamilyId, topLevel: TopLevelIntent) => {
  if (topLevel === "products") {
    return familyId !== PERSONAL_FAMILY_ID;
  }

  if (topLevel === "services") {
    return familyId !== VEHICLES_FAMILY_ID && familyId !== PERSONAL_FAMILY_ID;
  }

  if (topLevel === "personal") {
    return familyId === PERSONAL_FAMILY_ID;
  }

  return true;
};

const getTopLevelResultLabel = (topLevel: TopLevelIntent) => {
  if (topLevel === "personal") {
    return "Personal";
  }

  if (topLevel === "services") {
    return "Servicios";
  }

  return "Productos";
};

const mergeProducts = (
  existingProducts: Doc<"products">[],
  incomingProducts: Doc<"products">[],
) => {
  const productsById = new Map(
    existingProducts.map((product) => [product._id, product]),
  );

  incomingProducts.forEach((product) => {
    productsById.set(product._id, product);
  });

  return Array.from(productsById.values());
};

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topLevel?: string | string[];
    familyId?: string | string[];
    categoryId?: string | string[];
    query?: string | string[];
  }>();
  const paramTopLevel = getParamValue(params.topLevel);
  const paramFamilyId = getParamValue(params.familyId);
  const paramCategoryId = getParamValue(params.categoryId);
  const paramQuery = getParamValue(params.query);
  const initialTopLevel = resolveTopLevelIntent(paramTopLevel, paramFamilyId);
  const initialCategoryId =
    initialTopLevel === "personal" && paramCategoryId === LEGACY_PERSONAL_CATEGORY_ID
      ? null
      : paramCategoryId;

  const { isAuthenticated } = useAuthSession();
  const families = useMemo(() => getFamilies(), []);
  const [selectedTopLevel, setSelectedTopLevel] = useState<TopLevelIntent>(
    initialTopLevel,
  );
  const [selectedFamilyId, setSelectedFamilyId] = useState<FamilyId | "all">(
    initialTopLevel === "personal"
      ? PERSONAL_FAMILY_ID
      : paramFamilyId
        ? (paramFamilyId as FamilyId)
        : "all",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(
    initialCategoryId ? (initialCategoryId as CategoryId) : null,
  );
  const [searchQuery, setSearchQuery] = useState(paramQuery ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState((paramQuery ?? "").trim());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [searchPagination, setSearchPagination] = useState<{
    key: string;
    cursor?: string;
    products: Doc<"products">[];
  }>({
    key: "",
    products: [],
  });
  const lastTrackedSearchKeyRef = useRef<string | null>(null);
  const orderedTopLevelOptions = useMemo(
    () => getOrderedTopLevelOptions(selectedTopLevel),
    [selectedTopLevel],
  );
  const visibleFamilies = useMemo(
    () => families.filter((family) => isFamilyVisibleForTopLevel(family.id as FamilyId, selectedTopLevel)),
    [families, selectedTopLevel],
  );

  const selectedFamily = selectedFamilyId === "all"
    ? null
    : visibleFamilies.find((family) => family.id === selectedFamilyId) ?? null;
  const availableCategories = selectedFamily?.categories.filter((category) => !category.hidden) ?? [];
  const selectedCategory = selectedCategoryId
    ? availableCategories.find((category) => category.id === selectedCategoryId) ??
      getCategoryById(selectedCategoryId) ??
      null
    : null;

  const derivedListingType = selectedTopLevel === "products"
    ? "sell"
    : selectedTopLevel === "services" || selectedTopLevel === "personal"
      ? "rent"
      : undefined;
  const hasSearchTerm = debouncedQuery.length >= 3;
  const isBrowseMode = !hasSearchTerm && selectedTopLevel !== "all";
  const searchKey = [
    debouncedQuery.toLowerCase(),
    selectedTopLevel,
    selectedFamily?.id ?? "all",
    selectedCategory?.id ?? "all",
  ].join(":");

  useEffect(() => {
    const nextTopLevel = resolveTopLevelIntent(paramTopLevel, paramFamilyId);
    setSelectedTopLevel(nextTopLevel);

    if (nextTopLevel === "personal") {
      setSelectedFamilyId(PERSONAL_FAMILY_ID);
    } else if (paramFamilyId) {
      setSelectedFamilyId(paramFamilyId as FamilyId);
    } else {
      setSelectedFamilyId("all");
    }

    if (nextTopLevel === "personal" && paramCategoryId === LEGACY_PERSONAL_CATEGORY_ID) {
      setSelectedCategoryId(null);
    } else if (paramCategoryId) {
      const categoryId = paramCategoryId as CategoryId;
      setSelectedCategoryId(categoryId);

      if (!paramFamilyId && nextTopLevel !== "personal") {
        const matchedFamily = families.find((family) =>
          family.categories.some((category) => category.id === categoryId),
        );

        if (matchedFamily) {
          setSelectedFamilyId(matchedFamily.id as FamilyId);
        }
      }
    } else {
      setSelectedCategoryId(null);
    }

    setSearchQuery(paramQuery ?? "");
  }, [
    families,
    paramCategoryId,
    paramFamilyId,
    paramQuery,
    paramTopLevel,
  ]);

  useEffect(() => {
    if (selectedTopLevel === "personal") {
      if (selectedFamilyId !== PERSONAL_FAMILY_ID) {
        setSelectedFamilyId(PERSONAL_FAMILY_ID);
        setSelectedCategoryId(null);
      }

      return;
    }

    if (
      selectedFamilyId !== "all" &&
      !visibleFamilies.some((family) => family.id === selectedFamilyId)
    ) {
      setSelectedFamilyId("all");
      setSelectedCategoryId(null);
    }
  }, [selectedFamilyId, selectedTopLevel, visibleFamilies]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      saveRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      return;
    }

    const trackingKey = [
      debouncedQuery.toLowerCase(),
      selectedTopLevel,
      selectedFamily?.id ?? "all",
      selectedCategory?.id ?? "all",
    ].join(":");

    if (lastTrackedSearchKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedSearchKeyRef.current = trackingKey;
    trackSearch({
      query: debouncedQuery,
      topLevel: selectedTopLevel,
      familyId: selectedFamily?.id,
      categoryId: selectedCategory?.id,
    });
  }, [debouncedQuery, selectedCategory?.id, selectedFamily?.id, selectedTopLevel]);

  useEffect(() => {
    setSearchPagination({
      key: searchKey,
      products: [],
    });
  }, [searchKey]);

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

      searches = searches.filter((item) => item.toLowerCase() !== trimmedQuery.toLowerCase());
      searches.unshift(trimmedQuery);
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

  const handleClearRecentSearches = () => {
    Alert.alert(
      "Limpiar búsquedas",
      "¿Estás seguro de que quieres eliminar todas las búsquedas recientes?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpiar", style: "destructive", onPress: clearRecentSearches },
      ],
    );
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
  };

  const handleSelectTopLevel = (topLevel: TopLevelIntent) => {
    setSelectedTopLevel(topLevel);
    setSelectedFamilyId(topLevel === "personal" ? PERSONAL_FAMILY_ID : "all");
    setSelectedCategoryId(null);
  };

  const handleSelectFamily = (familyId: FamilyId | "all") => {
    setSelectedFamilyId(familyId);
    setSelectedCategoryId(null);
  };

  const handleSelectCategory = (categoryId: CategoryId | null) => {
    setSelectedCategoryId(categoryId);
  };

  const searchResults = useQuery(
    api.search.querySearch,
    hasSearchTerm
      ? {
          query: debouncedQuery,
          familyId: selectedFamily?.id,
          categoryId: selectedCategory?.id,
          listingType: derivedListingType,
          limit: 20,
          cursor:
            searchPagination.key === searchKey
              ? searchPagination.cursor
              : undefined,
        }
      : "skip",
  );

  const {
    results: browseProducts,
    status: browseStatus,
    loadMore: loadMoreBrowseProducts,
  } = usePaginatedQuery(
    api.products.feed,
    isBrowseMode
      ? {
          familyId: selectedFamily?.id,
          categoryId: selectedCategory?.id,
          listingType: derivedListingType,
        }
      : "skip",
    {
      initialNumItems: 20,
    },
  );

  useEffect(() => {
    if (!searchResults) {
      return;
    }

    setSearchPagination((currentPagination) => ({
      key: searchKey,
      cursor:
        currentPagination.key === searchKey
          ? currentPagination.cursor
          : undefined,
      products: mergeProducts(
        currentPagination.key === searchKey
          ? currentPagination.products
          : [],
        searchResults.products,
      ),
    }));
  }, [searchKey, searchResults]);

  const searchProducts = useMemo(
    () =>
      mergeProducts(
        searchPagination.key === searchKey
          ? searchPagination.products
          : [],
        searchResults?.products ?? [],
      ),
    [searchKey, searchPagination, searchResults],
  );
  const isLoadingFirstSearchPage =
    searchResults === undefined && searchProducts.length === 0;
  const isLoadingMoreSearchResults =
    searchResults === undefined && searchProducts.length > 0;

  const handleLoadMoreSearchResults = () => {
    if (!searchResults?.hasMore || !searchResults.nextCursor) {
      return;
    }

    setSearchPagination((currentPagination) => ({
      key: searchKey,
      cursor: searchResults.nextCursor ?? undefined,
      products:
        currentPagination.key === searchKey
          ? currentPagination.products
          : [],
    }));
  };

  const serviceResults = useMemo(
    () => searchProducts.filter((product) => product.type === "rent"),
    [searchProducts],
  );
  const productResults = useMemo(
    () => searchProducts.filter((product) => product.type === "sell"),
    [searchProducts],
  );

  const showTaxonomyFilters = selectedTopLevel !== "all" || hasSearchTerm;
  const browseTitle = selectedCategory
    ? selectedCategory.label
    : selectedFamily
      ? selectedFamily.label
      : selectedTopLevel === "personal"
        ? "Personal disponible"
        : selectedTopLevel === "services"
        ? "Servicios disponibles"
        : "Productos disponibles";
  const selectedTopLevelLabel = getTopLevelResultLabel(selectedTopLevel);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <Text style={styles.headerSubtitle}>Filtra con chips y entra directo al resultado.</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#8D8375"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            selectedTopLevel === "personal"
              ? "Buscar personal, oficios o empleo"
              : selectedTopLevel === "services"
                ? "Buscar servicios dentro de la categoría elegida"
                : "Buscar productos, marcas o servicios"
          }
          placeholderTextColor="#9E9E9E"
          autoFocus={initialTopLevel === "all" && !paramQuery}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de búsqueda</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {orderedTopLevelOptions.map((option) => {
              const isActive = selectedTopLevel === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterChip,
                    isActive && {
                      backgroundColor: option.accent,
                      borderColor: option.accent,
                    },
                  ]}
                  onPress={() => handleSelectTopLevel(option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={16}
                    color={isActive ? "#FFFFFF" : option.accent}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? "#FFFFFF" : option.accent },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {!hasSearchTerm && selectedTopLevel === "all" && (
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
              <ActivityIndicator size="small" color="#1B5E20" style={styles.loadingRecent} />
            ) : recentSearches.length > 0 ? (
              recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={`${search}-${index}`}
                  style={styles.recentItem}
                  onPress={() => handleRecentSearchPress(search)}
                >
                  <Ionicons name="time-outline" size={20} color="#757575" />
                  <Text style={styles.recentText}>{search}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color="#C6BDAE" />
                <Text style={styles.emptyTitle}>Elige Personal, Servicios o Compra y Venta</Text>
                <Text style={styles.emptyBody}>
                  Usa el buscador o toca un chip para entrar directo al recorrido correcto.
                </Text>
              </View>
            )}
          </View>
        )}

        {showTaxonomyFilters && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Familias</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {selectedTopLevel !== "personal" && (
                  <TouchableOpacity
                    style={[styles.filterChip, selectedFamilyId === "all" && styles.filterChipActive]}
                    onPress={() => handleSelectFamily("all")}
                  >
                    <Ionicons
                      name="apps"
                      size={16}
                      color={selectedFamilyId === "all" ? "#FFFFFF" : "#1B5E20"}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedFamilyId === "all" && styles.filterChipTextActive,
                      ]}
                    >
                      Todas las familias
                    </Text>
                  </TouchableOpacity>
                )}

                {visibleFamilies.map((family) => {
                  const isActive = selectedFamilyId === family.id;

                  return (
                    <TouchableOpacity
                      key={family.id}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => handleSelectFamily(family.id as FamilyId)}
                    >
                      <Ionicons
                        name={family.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={isActive ? "#FFFFFF" : family.color}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
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
                <Text style={styles.sectionTitle}>Categorías</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !selectedCategory && styles.filterChipActive,
                    ]}
                    onPress={() => handleSelectCategory(null)}
                  >
                    <Ionicons
                      name="grid"
                      size={16}
                      color={!selectedCategory ? "#FFFFFF" : "#1B5E20"}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        !selectedCategory && styles.filterChipTextActive,
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>

                  {availableCategories.map((category) => {
                    const isActive = selectedCategory?.id === category.id;

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() => handleSelectCategory(category.id)}
                      >
                        <Ionicons
                          name={category.icon as keyof typeof Ionicons.glyphMap}
                          size={16}
                          color={isActive ? "#FFFFFF" : category.color}
                        />
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
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
          </>
        )}

        {isBrowseMode && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{browseTitle}</Text>
              <Text style={styles.sectionBadge}>{selectedTopLevelLabel}</Text>
            </View>

            <Text style={styles.sectionDescription}>
              {selectedTopLevel === "personal"
                ? "Resultados recientes de personal dentro del filtro actual."
                : selectedTopLevel === "services"
                  ? "Resultados recientes de servicios dentro del filtro actual."
                : "Resultados recientes de productos físicos dentro del filtro actual."}
            </Text>

            {browseStatus === "LoadingFirstPage" ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1B5E20" />
              </View>
            ) : browseProducts.length > 0 ? (
              <View style={styles.productsContainer}>
                {browseProducts.map((product: (typeof browseProducts)[number]) => (
                  <ListingCard
                    key={product._id}
                    product={product}
                    variant={isAuthenticated ? "full" : "public"}
                  />
                ))}
                {browseStatus !== "Exhausted" && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() => loadMoreBrowseProducts(20)}
                    disabled={browseStatus === "LoadingMore"}
                  >
                    {browseStatus === "LoadingMore" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loadMoreButtonText}>Cargar más</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="layers-outline" size={40} color="#C6BDAE" />
                <Text style={styles.emptyTitle}>No hay publicaciones para este filtro</Text>
                <Text style={styles.emptyBody}>
                  Prueba con otra familia o elimina la categoría para ampliar resultados.
                </Text>
              </View>
            )}
          </View>
        )}

        {hasSearchTerm && (
          <View style={styles.section}>
            {isLoadingFirstSearchPage ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1B5E20" />
              </View>
            ) : (
              <>
                {selectedTopLevel === "all" && serviceResults.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Servicios</Text>
                    <View style={styles.productsContainer}>
                      {serviceResults.map((product) => (
                        <ListingCard
                          key={product._id}
                          product={product}
                          variant={isAuthenticated ? "full" : "public"}
                        />
                      ))}
                    </View>
                  </>
                )}

                {selectedTopLevel === "all" && productResults.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Productos</Text>
                    <View style={styles.productsContainer}>
                      {productResults.map((product) => (
                        <ListingCard
                          key={product._id}
                          product={product}
                          variant={isAuthenticated ? "full" : "public"}
                        />
                      ))}
                    </View>
                  </>
                )}

                {selectedTopLevel !== "all" && searchProducts.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>{selectedTopLevelLabel}</Text>
                    <View style={styles.productsContainer}>
                      {searchProducts.map((product) => (
                        <ListingCard
                          key={product._id}
                          product={product}
                          variant={isAuthenticated ? "full" : "public"}
                        />
                      ))}
                    </View>
                  </>
                )}

                {selectedTopLevel === "all" && isAuthenticated && (searchResults?.profiles.length ?? 0) > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Perfiles</Text>
                    {searchResults?.profiles.map((profile) => (
                      <TouchableOpacity
                        key={profile._id}
                        style={styles.recentItem}
                        onPress={() => router.push(`/user-profile/${profile.userId}`)}
                      >
                        <Ionicons name="person-outline" size={20} color="#757575" />
                        <Text style={styles.recentText}>{profile.displayName}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#9E9E9E" />
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {searchProducts.length === 0 &&
                  (selectedTopLevel !== "all" || (searchResults?.profiles.length ?? 0) === 0) && (
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={40} color="#C6BDAE" />
                      <Text style={styles.emptyTitle}>No encontramos coincidencias</Text>
                      <Text style={styles.emptyBody}>
                        Cambia la búsqueda o ajusta familia y categoría para ampliar resultados.
                      </Text>
                    </View>
                  )}

                {(isLoadingMoreSearchResults || searchResults?.hasMore) && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreSearchResults}
                    disabled={isLoadingMoreSearchResults}
                  >
                    {isLoadingMoreSearchResults ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loadMoreButtonText}>Cargar más</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
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
    backgroundColor: "#F4F1EA",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F1A14",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6A5F50",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6DDCC",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#212121",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F1A14",
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#6D4C41",
    letterSpacing: 0.8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6A5F50",
  },
  chipsRow: {
    paddingRight: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFDF8",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED3C2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: "#1B5E20",
    borderColor: "#1B5E20",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1A14",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  productsContainer: {
    gap: 12,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: "center",
  },
  loadingRecent: {
    marginTop: 12,
  },
  loadMoreButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B5E20",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loadMoreButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#E6DDCC",
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: "#4D4336",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: "#E6DDCC",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F1A14",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6A5F50",
    textAlign: "center",
  },
});
