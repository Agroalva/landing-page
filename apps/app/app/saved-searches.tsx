import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc } from "../convex/_generated/dataModel";
import { useAuthSession } from "@/hooks/use-session";
import { buildSavedSearchParams } from "@/utils/saved-search-params";

export default function SavedSearchesScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const savedSearches = useQuery(api.savedSearches.list, isAuthenticated ? {} : "skip");
  const setAlertsEnabled = useMutation(api.savedSearches.setAlertsEnabled);
  const removeSavedSearch = useMutation(api.savedSearches.remove);

  const openSearch = (search: Doc<"savedSearches">) => {
    router.push({
      pathname: "/(tabs)/search",
      params: buildSavedSearchParams(search),
    });
  };

  const toggleAlerts = async (search: Doc<"savedSearches">, enabled: boolean) => {
    try {
      await setAlertsEnabled({ savedSearchId: search._id, enabled });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo actualizar la búsqueda");
    }
  };

  const confirmRemove = (search: Doc<"savedSearches">) => {
    Alert.alert("Borrar búsqueda", `¿Querés dejar de seguir "${search.label}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          try {
            await removeSavedSearch({ savedSearchId: search._id });
          } catch (error: any) {
            Alert.alert("Error", error?.message || "No se pudo borrar la búsqueda");
          }
        },
      },
    ]);
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
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Búsquedas guardadas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {savedSearches === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : savedSearches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={56} color="#C6BDAE" />
            <Text style={styles.emptyTitle}>Todavía no guardaste búsquedas</Text>
            <Text style={styles.emptyBody}>
              {"En Explorar, buscá algo (por ejemplo una sembradora en Córdoba) y tocá “Guardar búsqueda”. Te avisamos cuando se publique algo nuevo que coincida."}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/search")}
            >
              <Text style={styles.primaryButtonText}>Ir a Explorar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savedSearches.map((search) => (
            <TouchableOpacity
              key={search._id}
              style={styles.card}
              onPress={() => openSearch(search)}
              activeOpacity={0.7}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="search" size={20} color="#1B5E20" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {search.label}
                </Text>
                <Text style={styles.cardMeta}>
                  {search.alertsEnabled ? "Avisos activados" : "Avisos pausados"}
                </Text>
              </View>
              <Switch
                value={search.alertsEnabled}
                onValueChange={(enabled) => toggleAlerts(search, enabled)}
                trackColor={{ true: "#81C784", false: "#E0E0E0" }}
                thumbColor={search.alertsEnabled ? "#1B5E20" : "#FAFAFA"}
                accessibilityLabel="Avisos de publicaciones nuevas"
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmRemove(search)}
                accessibilityLabel="Borrar búsqueda"
              >
                <Ionicons name="trash-outline" size={20} color="#C62828" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: "#E6DDCC",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
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
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#1B5E20",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFDF8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6DDCC",
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F1A14",
  },
  cardMeta: {
    fontSize: 12,
    color: "#6A5F50",
  },
  deleteButton: {
    padding: 8,
  },
});
