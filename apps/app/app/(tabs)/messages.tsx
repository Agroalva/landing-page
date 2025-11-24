import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConvexImage } from "@/components/ConvexImage";

type Conversation = {
  _id: Id<"conversations">;
  memberIds: string[];
  lastMessageAt?: number;
  lastMessageText?: string;
  lastMessageSenderId?: string;
};

function ConversationItem({
  conversation,
  currentUserId,
  router,
}: {
  conversation: Conversation;
  currentUserId: string | undefined;
  router: any;
}) {
  const otherMembers = conversation.memberIds.filter(
    (id) => id !== currentUserId
  );
  const otherMemberId = otherMembers[0];
  const otherMemberProfile = useQuery(
    api.users.getByUserId,
    otherMemberId ? { userId: otherMemberId } : "skip"
  );
  const unreadCount = useQuery(
    api.conversations.getUnreadCount,
    conversation._id ? { conversationId: conversation._id } : "skip"
  );

  const isLastMessageFromMe =
    currentUserId &&
    conversation.lastMessageSenderId === currentUserId;
  const displayName =
    otherMemberProfile?.displayName ||
    (otherMembers.length === 1 ? "Usuario" : `${otherMembers.length} personas`);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Ayer";
    } else if (days < 7) {
      return `Hace ${days} días`;
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${conversation._id}`)}
    >
      <View style={styles.avatarContainer}>
        {otherMemberProfile?.avatarId ? (
          <ConvexImage
            storageId={otherMemberProfile.avatarId}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#9E9E9E" />
          </View>
        )}
      </View>

      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.conversationTime}>
            {formatTime(conversation.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text
            style={[
              styles.lastMessage,
              (unreadCount ?? 0) > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {isLastMessageFromMe && conversation.lastMessageText
              ? `Tú: ${conversation.lastMessageText}`
              : conversation.lastMessageText || "Nueva conversación"}
          </Text>
          {(unreadCount ?? 0) > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount! > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const conversations = useQuery(api.conversations.listForUser);

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
        <Text style={styles.headerTitle}>Mensajes</Text>
        <TouchableOpacity
          onPress={() => router.push("/new-message")}
        >
          <Ionicons name="create-outline" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {conversations === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No hay conversaciones</Text>
            <Text style={styles.emptySubtitle}>
              Comienza a conectar con otros usuarios
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              currentUserId={user?.id as string | undefined}
              router={router}
            />
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
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

