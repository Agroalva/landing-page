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
import { useRouter } from "expo-router";

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    name: "Carlos Méndez",
    lastMessage: "¿Aún tienes el tractor disponible?",
    time: "10:30 AM",
    unread: 2,
    avatar: "https://i.pravatar.cc/150?img=12",
    online: true,
  },
  {
    id: 2,
    name: "Ana Rodríguez",
    lastMessage: "Perfecto, nos vemos mañana",
    time: "Ayer",
    unread: 0,
    avatar: "https://i.pravatar.cc/150?img=5",
    online: false,
  },
  {
    id: 3,
    name: "Luis González",
    lastMessage: "Gracias por la información",
    time: "Hace 2 días",
    unread: 0,
    avatar: "https://i.pravatar.cc/150?img=33",
    online: false,
  },
  {
    id: 4,
    name: "María Fernández",
    lastMessage: "¿Cuánto cuesta el servicio de fumigación?",
    time: "Hace 3 días",
    unread: 1,
    avatar: "https://i.pravatar.cc/150?img=9",
    online: true,
  },
];

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {MOCK_CONVERSATIONS.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationItem}
            onPress={() => router.push(`/chat/${conversation.id}`)}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: conversation.avatar }}
                style={styles.avatar}
              />
              {conversation.online && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                <Text style={styles.conversationTime}>{conversation.time}</Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text
                  style={[
                    styles.lastMessage,
                    conversation.unread > 0 && styles.lastMessageUnread,
                  ]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Empty State */}
        {MOCK_CONVERSATIONS.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No hay conversaciones</Text>
            <Text style={styles.emptySubtitle}>
              Comienza a conectar con otros usuarios
            </Text>
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
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E0E0E0",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  conversationInfo: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  conversationTime: {
    fontSize: 12,
    color: "#757575",
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#757575",
  },
  lastMessageUnread: {
    fontWeight: "600",
    color: "#212121",
  },
  unreadBadge: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
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
});

