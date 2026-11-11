import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Keyboard,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConvexImage } from "@/components/ConvexImage";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import {
  useFileUpload,
  selectImage,
  type ImageSource,
  type SelectedImage,
} from "@/hooks/use-file-upload";

type Message = {
  _id: Id<"messages">;
  senderId: string;
  text: string;
  mediaId?: Id<"_storage">;
  // Set by the backend when `text` is only a placeholder for older app versions.
  textIsFallback?: boolean;
  createdAt: number;
};

// A photo message that is being compressed/uploaded/sent.
type OutgoingPhoto = {
  image: SelectedImage;
  caption: string;
};

function MessageItem({
  msg,
  isMe,
  formatTime,
  onPressPhoto,
}: {
  msg: Message;
  isMe: boolean;
  formatTime: (timestamp: number) => string;
  onPressPhoto: (storageId: Id<"_storage">) => void;
}) {
  const caption = msg.mediaId && msg.textIsFallback ? "" : msg.text;

  const senderProfile = useQuery(
    api.users.getByUserId,
    msg.senderId ? { userId: msg.senderId } : "skip"
  );

  return (
    <View
      style={[styles.messageRow, isMe && styles.messageRowMe]}
    >
      {!isMe && (
        <View style={styles.senderAvatar}>
          {senderProfile?.avatarId ? (
            <ConvexImage
              storageId={senderProfile.avatarId}
              style={styles.senderAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.senderAvatarPlaceholder}>
              <Ionicons name="person" size={16} color="#9E9E9E" />
            </View>
          )}
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isMe && styles.messageBubbleMe,
          msg.mediaId && styles.messageBubblePhoto,
        ]}
      >
        {!isMe && (
          <Text style={[styles.senderName, msg.mediaId && styles.photoBubblePadding]}>
            {senderProfile?.displayName || "Usuario"}
          </Text>
        )}
        {msg.mediaId && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPressPhoto(msg.mediaId!)}
            accessibilityRole="imagebutton"
            accessibilityLabel="Ver foto"
          >
            <ConvexImage
              storageId={msg.mediaId}
              style={styles.messagePhoto}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        {!!caption && (
          <Text
            style={[
              styles.messageText,
              isMe && styles.messageTextMe,
              msg.mediaId && styles.photoCaption,
            ]}
          >
            {caption}
          </Text>
        )}
        <Text
          style={[
            styles.messageTime,
            isMe && styles.messageTimeMe,
            msg.mediaId && styles.photoBubblePadding,
          ]}
        >
          {formatTime(msg.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function OutgoingPhotoItem({ photo }: { photo: OutgoingPhoto }) {
  return (
    <View style={[styles.messageRow, styles.messageRowMe]}>
      <View
        style={[
          styles.messageBubble,
          styles.messageBubbleMe,
          styles.messageBubblePhoto,
        ]}
      >
        <View>
          <Image
            source={{ uri: photo.image.uri }}
            style={styles.messagePhoto}
            resizeMode="cover"
          />
          <View style={styles.photoSendingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        </View>
        {!!photo.caption && (
          <Text style={[styles.messageText, styles.messageTextMe, styles.photoCaption]}>
            {photo.caption}
          </Text>
        )}
        <Text style={[styles.messageTime, styles.messageTimeMe, styles.photoBubblePadding]}>
          Enviando...
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Photo picked by the user, shown as a preview above the input until sent.
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [outgoingPhoto, setOutgoingPhoto] = useState<OutgoingPhoto | null>(null);
  const [viewerStorageId, setViewerStorageId] = useState<Id<"_storage"> | null>(null);
  const { uploadCompressedImage } = useFileUpload();
  const conversationId = params.id as Id<"conversations">;
  const messageInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get conversation details
  const allConversations = useQuery(api.conversations.listForUser);
  const conversation = useMemo(() => {
    return allConversations?.find((c) => c._id === conversationId);
  }, [allConversations, conversationId]);
  const messages = useQuery(
    api.conversations.listMessages,
    conversationId ? { conversationId, limit: 50 } : "skip"
  );
  const sendMessage = useMutation(api.conversations.sendMessage);
  const markAsRead = useMutation(api.conversations.markMessagesAsRead);

  // Get other participant
  const otherMemberId = useMemo(() => {
    if (!conversation || !user) return null;
    return conversation.memberIds.find((id: string) => id !== user.id) || null;
  }, [conversation, user]);

  const otherMemberProfile = useQuery(
    api.users.getByUserId,
    otherMemberId ? { userId: otherMemberId } : "skip"
  );

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId && user) {
      markAsRead({ conversationId }).catch(console.error);
    }
  }, [conversationId, user, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const scrollToBottomSoon = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const pickImage = async (source: ImageSource) => {
    try {
      const { image, permissionDenied } = await selectImage(source);
      if (permissionDenied) {
        Alert.alert(
          source === "camera" ? "Sin acceso a la cámara" : "Sin acceso a tus fotos",
          source === "camera"
            ? "Habilita el permiso de cámara en la configuración para tomar fotos."
            : "Habilita el acceso a tus fotos en la configuración para enviarlas.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir configuración", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      if (image) {
        setSelectedImage(image);
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
      Alert.alert("Error", "No se pudo abrir la foto. Intenta nuevamente.");
    }
  };

  const handleAttach = () => {
    if (isSending) return;
    Keyboard.dismiss();
    Alert.alert("Enviar una foto", undefined, [
      { text: "Tomar foto", onPress: () => pickImage("camera") },
      { text: "Elegir de la galería", onPress: () => pickImage("library") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleSendPhoto = async (image: SelectedImage) => {
    if (!conversationId || isSending || !user) return;

    const caption = message.trim();
    setSelectedImage(null);
    setMessage("");
    setIsSending(true);
    setOutgoingPhoto({ image, caption });
    Keyboard.dismiss();
    messageInputRef.current?.blur();
    scrollToBottomSoon();

    try {
      const mediaId = await uploadCompressedImage(image);
      if (!mediaId) {
        throw new Error("Upload returned no storage id");
      }
      await sendMessage({ conversationId, text: caption, mediaId });
      scrollToBottomSoon();
    } catch (error) {
      console.error("Failed to send photo:", error);
      // Restore the preview and caption so the user can retry.
      setSelectedImage(image);
      setMessage(caption);
      Alert.alert(
        "No se pudo enviar la foto",
        "Revisa tu conexión e intenta nuevamente."
      );
    } finally {
      setOutgoingPhoto(null);
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (selectedImage) {
      await handleSendPhoto(selectedImage);
      return;
    }
    if (!message.trim() || !conversationId || isSending || !user) return;

    const messageText = message.trim();

    setMessage("");
    setIsSending(true);
    Keyboard.dismiss();
    
    // Clear focus from input
    messageInputRef.current?.blur();

    try {
      await sendMessage({
        conversationId,
        text: messageText,
      });
      // Scroll to bottom after sending
      scrollToBottomSoon();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: Array<{ date: string; messages: typeof messages }> = [];
    let currentDate = "";
    
    messages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  }, [messages]);

  const canSend = !isSending && (!!selectedImage || !!message.trim());

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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
            {otherMemberProfile?.avatarId ? (
              <ConvexImage
                storageId={otherMemberProfile.avatarId}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#9E9E9E" />
              </View>
            )}
          </View>
          <View>
            <Text style={styles.contactName}>
              {otherMemberProfile?.displayName || "Usuario"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            if (otherMemberId) {
              router.push(`/user-profile/${otherMemberId}`);
            }
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#212121" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
            </View>
          ) : messages.length === 0 && !outgoingPhoto ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No hay mensajes aún</Text>
              <Text style={styles.emptySubtext}>Envía el primer mensaje</Text>
            </View>
          ) : (
            groupedMessages.map((group) => (
              <View key={group.date}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{group.date}</Text>
                </View>
                {group.messages.map((msg) => {
                  const isMe = user && msg.senderId === user.id;
                  return (
                    <MessageItem
                      key={msg._id}
                      msg={msg}
                      isMe={!!isMe}
                      formatTime={formatTime}
                      onPressPhoto={setViewerStorageId}
                    />
                  );
                })}
              </View>
            ))
          )}
          {outgoingPhoto && <OutgoingPhotoItem photo={outgoingPhoto} />}
        </ScrollView>

        {/* Photo preview before sending */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Foto lista para enviar</Text>
              <Text style={styles.previewSubtitle}>
                Puedes agregar un mensaje (opcional)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewRemove}
              onPress={() => setSelectedImage(null)}
              accessibilityRole="button"
              accessibilityLabel="Quitar foto"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttach}
            disabled={isSending}
            accessibilityRole="button"
            accessibilityLabel="Adjuntar foto"
          >
            <Ionicons
              name="camera-outline"
              size={24}
              color={isSending ? "#BDBDBD" : "#2E7D32"}
            />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={messageInputRef}
              style={styles.input}
              placeholder={
                selectedImage ? "Agrega un mensaje..." : "Escribe un mensaje..."
              }
              value={message}
              onChangeText={setMessage}
              multiline
              placeholderTextColor="#9E9E9E"
              editable={!isSending}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend && styles.sendButtonActive,
              isSending && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel={selectedImage ? "Enviar foto" : "Enviar mensaje"}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={canSend ? "#FFFFFF" : "#9E9E9E"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ImageViewerModal
        storageId={viewerStorageId}
        onClose={() => setViewerStorageId(null)}
      />
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
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
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
  messageBubblePhoto: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  photoBubblePadding: {
    paddingHorizontal: 8,
  },
  messagePhoto: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  photoCaption: {
    paddingHorizontal: 8,
    marginTop: 6,
  },
  photoSendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  previewSubtitle: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  previewRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#757575",
    justifyContent: "center",
    alignItems: "center",
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  senderAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  senderAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#757575",
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
});

