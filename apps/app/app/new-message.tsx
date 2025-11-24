import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ConvexImage } from "@/components/ConvexImage";

export default function NewMessageScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const ensureConversation = useMutation(api.conversations.ensureConversation);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search for users
  const searchResults = useQuery(
    api.search.querySearch,
    debouncedQuery.length >= 2
      ? { query: debouncedQuery, limit: 20 }
      : "skip"
  );

  // Filter out current user from results
  const filteredProfiles = useMemo(() => {
    if (!searchResults?.profiles) return [];
    return searchResults.profiles.filter(
      (profile) => profile.userId !== user?.id
    );
  }, [searchResults, user]);

  const handleSelectUser = async (userId: string) => {
    if (!user?.id) return;

    try {
      // Create or get conversation
      const conversationId = await ensureConversation({
        memberIds: [user.id, userId].sort(),
      });

      // Navigate to chat
      router.replace(`/chat/${conversationId}`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo crear la conversación");
    }
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo mensaje</Text>
        <View style={styles.placeholder} />
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
          placeholder="Buscar usuarios..."
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.listContainer}>
        {debouncedQuery.length < 2 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>
              Busca usuarios para comenzar una conversación
            </Text>
            <Text style={styles.emptySubtext}>
              Escribe al menos 2 caracteres para buscar
            </Text>
          </View>
        ) : searchResults === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : filteredProfiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            <Text style={styles.emptySubtext}>
              Intenta con otro término de búsqueda
            </Text>
          </View>
        ) : (
          filteredProfiles.map((profile) => (
            <TouchableOpacity
              key={profile._id}
              style={styles.userItem}
              onPress={() => handleSelectUser(profile.userId)}
            >
              <View style={styles.avatarContainer}>
                {profile.avatarId ? (
                  <ConvexImage
                    storageId={profile.avatarId}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#9E9E9E" />
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile.displayName}</Text>
                {profile.bio && (
                  <Text style={styles.userBio} numberOfLines={1}>
                    {profile.bio}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  placeholder: {
    width: 32,
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
  clearButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E0E0",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  userBio: {
    fontSize: 14,
    color: "#757575",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
    textAlign: "center",
  },
});

