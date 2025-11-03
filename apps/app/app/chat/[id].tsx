import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const [message, setMessage] = useState("");
  const conversationId = params.id as Id<"conversations">;
  
  const messages = useQuery(
    api.conversations.listMessages,
    conversationId ? { conversationId, limit: 50 } : "skip"
  );
  const sendMessage = useMutation(api.conversations.sendMessage);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/sign-in");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;

    try {
      await sendMessage({
        conversationId,
        text: message.trim(),
      });
      setMessage("");
    } catch (error: any) {
      console.error("Failed to send message:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
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
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>

        <View style={styles.contactInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#9E9E9E" />
            </View>
          </View>
          <View>
            <Text style={styles.contactName}>Conversación</Text>
            <Text style={styles.onlineStatus}>Activa</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#212121" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No hay mensajes aún</Text>
              <Text style={styles.emptySubtext}>Envía el primer mensaje</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isMe = user && msg.senderId === (user._id as string);
              return (
                <View
                  key={msg._id}
                  style={[
                    styles.messageRow,
                    isMe && styles.messageRowMe,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMe && styles.messageBubbleMe,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMe && styles.messageTextMe,
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isMe && styles.messageTimeMe,
                      ]}
                    >
                      {formatTime(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={28} color="#2E7D32" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              value={message}
              onChangeText={setMessage}
              multiline
              placeholderTextColor="#9E9E9E"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              message.trim() && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? "#FFFFFF" : "#9E9E9E"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  onlineStatus: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: "#9E9E9E",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  messageRowMe: {
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubbleMe: {
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 20,
  },
  messageText: {
    fontSize: 15,
    color: "#212121",
    lineHeight: 20,
  },
  messageTextMe: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 11,
    color: "#9E9E9E",
    marginTop: 4,
  },
  messageTimeMe: {
    color: "#FFFFFFCC",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  attachButton: {
    padding: 4,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: "#212121",
    minHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#2E7D32",
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
});

