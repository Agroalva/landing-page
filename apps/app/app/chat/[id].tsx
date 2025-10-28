import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const MOCK_MESSAGES = [
  {
    id: 1,
    text: "Hola, estoy interesado en el tractor",
    sender: "other",
    time: "10:30 AM",
  },
  {
    id: 2,
    text: "Hola! Claro, con gusto. ¿Qué información necesitas?",
    sender: "me",
    time: "10:32 AM",
  },
  {
    id: 3,
    text: "¿Aún está disponible?",
    sender: "other",
    time: "10:33 AM",
  },
  {
    id: 4,
    text: "Sí, está disponible. ¿Te gustaría verlo?",
    sender: "me",
    time: "10:35 AM",
  },
  {
    id: 5,
    text: "Perfecto! ¿Cuándo podríamos coordinar?",
    sender: "other",
    time: "10:36 AM",
  },
];

const CONTACT = {
  name: "Carlos Méndez",
  avatar: "https://i.pravatar.cc/150?img=12",
  online: true,
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // Logic to send message
      setMessage("");
    }
  };

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
            <Image source={{ uri: CONTACT.avatar }} style={styles.avatar} />
            {CONTACT.online && <View style={styles.onlineIndicator} />}
          </View>
          <View>
            <Text style={styles.contactName}>{CONTACT.name}</Text>
            <Text style={styles.onlineStatus}>
              {CONTACT.online ? "En línea" : "Desconectado"}
            </Text>
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
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>Hoy</Text>
          </View>

          {MOCK_MESSAGES.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === "me" && styles.messageRowMe,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.sender === "me" && styles.messageBubbleMe,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === "me" && styles.messageTextMe,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    msg.sender === "me" && styles.messageTimeMe,
                  ]}
                >
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
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
});

