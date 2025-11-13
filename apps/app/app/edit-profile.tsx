import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ConvexImage } from "@/components/ConvexImage";
import { Id } from "../convex/_generated/dataModel";

export default function EditProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const profile = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateProfile);
  const { pickImage, uploading: uploadingAvatar } = useFileUpload();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarId, setAvatarId] = useState<Id<"_storage"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    bio?: string;
    phoneNumber?: string;
  }>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const displayNameInputRef = useRef<TextInput>(null);
  const bioInputRef = useRef<TextInput>(null);
  const phoneNumberInputRef = useRef<TextInput>(null);
  const fieldLayouts = useRef<{ [key: string]: number }>({});

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setPhoneNumber(profile.phoneNumber || "");
      setAvatarId(profile.avatarId || null);
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: { displayName?: string; bio?: string; phoneNumber?: string } = {};

    // Validate display name
    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      newErrors.displayName = "El nombre es requerido";
    } else if (trimmedDisplayName.length < 2) {
      newErrors.displayName = "El nombre debe tener al menos 2 caracteres";
    } else if (trimmedDisplayName.length > 50) {
      newErrors.displayName = "El nombre no puede exceder 50 caracteres";
    }

    // Validate bio (optional but if provided, check length)
    if (bio.trim().length > 200) {
      newErrors.bio = "La biografía no puede exceder 200 caracteres";
    }

    // Validate phone number (optional but if provided, should be valid)
    const trimmedPhoneNumber = phoneNumber.trim();
    if (trimmedPhoneNumber) {
      // Remove spaces, dashes, and parentheses for validation
      const digitsOnly = trimmedPhoneNumber.replace(/[\s\-()]/g, "");
      // Check if it starts with + and has at least 10 digits, or has at least 10 digits without +
      const isValidFormat = 
        (digitsOnly.startsWith("+") && digitsOnly.length >= 11) ||
        (!digitsOnly.startsWith("+") && digitsOnly.length >= 10 && /^\d+$/.test(digitsOnly));
      
      if (!isValidFormat) {
        newErrors.phoneNumber = "Ingresa un número de teléfono válido (ej: +1234567890 o 1234567890)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangeAvatar = async () => {
    try {
      const storageId = await pickImage();
      if (storageId) {
        setAvatarId(storageId);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo seleccionar la imagen");
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        avatarId: avatarId || undefined,
      });

      Alert.alert(
        "Éxito",
        "Perfil actualizado correctamente",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || uploadingAvatar}
          style={[
            styles.saveButton,
            (loading || uploadingAvatar) && styles.saveButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleChangeAvatar}
            disabled={uploadingAvatar}
          >
            {avatarId ? (
              <ConvexImage
                storageId={avatarId}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#9E9E9E" />
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            Toca para cambiar tu foto de perfil
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Display Name Field */}
          <View 
            style={styles.fieldContainer}
            onLayout={(event) => {
              fieldLayouts.current.displayName = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              ref={displayNameInputRef}
              style={[styles.input, errors.displayName && styles.inputError]}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) {
                  setErrors({ ...errors, displayName: undefined });
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  const y = fieldLayouts.current.displayName;
                  if (y !== undefined) {
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                  }
                }, 300);
              }}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#9E9E9E"
              maxLength={50}
              returnKeyType="next"
              onSubmitEditing={() => {
                bioInputRef.current?.focus();
              }}
            />
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}
            <Text style={styles.characterCount}>
              {displayName.length}/50
            </Text>
          </View>

          {/* Bio Field */}
          <View 
            style={styles.fieldContainer}
            onLayout={(event) => {
              fieldLayouts.current.bio = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>Biografía (opcional)</Text>
            <TextInput
              ref={bioInputRef}
              style={[
                styles.textArea,
                errors.bio && styles.inputError,
              ]}
              value={bio}
              onChangeText={(text) => {
                setBio(text);
                if (errors.bio) {
                  setErrors({ ...errors, bio: undefined });
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  const y = fieldLayouts.current.bio;
                  if (y !== undefined) {
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                  }
                }, 300);
              }}
              placeholder="Cuéntanos sobre ti..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => {
                phoneNumberInputRef.current?.focus();
              }}
            />
            {errors.bio && (
              <Text style={styles.errorText}>{errors.bio}</Text>
            )}
            <Text style={styles.characterCount}>{bio.length}/200</Text>
          </View>

          {/* WhatsApp/Phone Number Field */}
          <View 
            style={styles.fieldContainer}
            onLayout={(event) => {
              fieldLayouts.current.phoneNumber = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>Número de WhatsApp (opcional)</Text>
            <TextInput
              ref={phoneNumberInputRef}
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (errors.phoneNumber) {
                  setErrors({ ...errors, phoneNumber: undefined });
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  const y = fieldLayouts.current.phoneNumber;
                  if (y !== undefined) {
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                  }
                }, 300);
              }}
              placeholder="+1234567890 o 1234567890"
              placeholderTextColor="#9E9E9E"
              keyboardType="phone-pad"
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={() => {
                phoneNumberInputRef.current?.blur();
              }}
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
            <Text style={styles.fieldHint}>
              Este número se usará para contactarte por WhatsApp
            </Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#757575",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2E7D32",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarHint: {
    fontSize: 14,
    color: "#757575",
  },
  formSection: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputError: {
    borderColor: "#F44336",
  },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 100,
  },
  errorText: {
    fontSize: 13,
    color: "#F44336",
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 4,
    textAlign: "right",
  },
  fieldHint: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 4,
  },
});

