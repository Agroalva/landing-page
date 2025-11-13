import React, { useState } from "react";
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
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ConvexImage } from "@/components/ConvexImage";
import { Id } from "../convex/_generated/dataModel";

const CATEGORIES = [
  "Maquinaria",
  "Semillas",
  "Servicios",
  "Fertilizantes",
  "Transporte",
  "Herramientas",
  "Otros",
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const createProduct = useMutation(api.products.create);
  const { pickImage, uploading: uploadingImage } = useFileUpload();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"rent" | "sell">("sell");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaIds, setMediaIds] = useState<Id<"_storage">[]>([]);

  const handleAddImage = async () => {
    if (mediaIds.length >= 5) {
      Alert.alert("Límite alcanzado", "Puedes agregar hasta 5 fotos");
      return;
    }

    try {
      const storageId = await pickImage();
      if (storageId) {
        setMediaIds([...mediaIds, storageId]);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo subir la imagen");
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaIds(mediaIds.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!name.trim() || !isAuthenticated) {
      Alert.alert("Error", "Por favor completa el nombre del producto");
      return;
    }

    setLoading(true);
    try {
      await createProduct({ 
        name: name.trim(),
        description: description.trim() || undefined,
        type: type,
        price: price ? parseFloat(price) : undefined,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo crear el producto");
    } finally {
      setLoading(false);
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo producto</Text>
        <TouchableOpacity onPress={handlePublish} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : (
            <Text style={styles.publishText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Fotos <Text style={styles.required}>*</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesContainer}
          >
            {mediaIds.length < 5 && (
              <TouchableOpacity 
                style={[styles.addImageButton, uploadingImage && styles.addImageButtonDisabled]}
                onPress={handleAddImage}
                disabled={uploadingImage || loading}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color="#2E7D32" />
                    <Text style={styles.addImageText}>Agregar foto</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {mediaIds.map((storageId, index) => (
              <View key={index} style={styles.imagePreview}>
                <ConvexImage 
                  storageId={storageId} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                  disabled={loading}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.helperText}>
            Agrega hasta 5 fotos de tu producto o servicio
          </Text>
        </View>

        {/* Product Name */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Nombre del producto <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Tractor John Deere 2020"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9E9E9E"
            editable={!loading}
          />
        </View>

        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Tipo <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "sell" && styles.typeButtonSelected,
              ]}
              onPress={() => setType("sell")}
              disabled={loading}
            >
              <Ionicons
                name="cash"
                size={20}
                color={type === "sell" ? "#FFFFFF" : "#2E7D32"}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === "sell" && styles.typeButtonTextSelected,
                ]}
              >
                Venta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "rent" && styles.typeButtonSelected,
              ]}
              onPress={() => setType("rent")}
              disabled={loading}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={type === "rent" ? "#FFFFFF" : "#2E7D32"}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === "rent" && styles.typeButtonTextSelected,
                ]}
              >
                Alquiler
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Precio (opcional)</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              value={price}
              onChangeText={(text) => {
                // Only allow numbers and decimal point
                const cleaned = text.replace(/[^0-9.]/g, "");
                setPrice(cleaned);
              }}
              keyboardType="numeric"
              placeholderTextColor="#9E9E9E"
              editable={!loading}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe tu producto o servicio..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#9E9E9E"
            editable={!loading}
          />
          <Text style={styles.helperText}>
            Incluye detalles importantes como condición, características, etc.
          </Text>
        </View>

        {/* Additional Information */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2E7D32" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Consejos para una buena publicación</Text>
            <Text style={styles.infoText}>
              • Usa fotos claras y de buena calidad{"\n"}
              • Describe detalladamente el producto{"\n"}
              • Indica el estado real del artículo{"\n"}
              • Responde rápido a los mensajes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.publishButton, loading && styles.publishButtonDisabled]} 
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.publishButtonText}>Publicar ahora</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  publishText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  required: {
    color: "#F44336",
  },
  imagesContainer: {
    paddingBottom: 12,
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2E7D32",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addImageButtonDisabled: {
    opacity: 0.5,
  },
  addImageText: {
    fontSize: 12,
    color: "#2E7D32",
    marginTop: 8,
    fontWeight: "500",
  },
  imagePreview: {
    position: "relative",
    marginRight: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  helperText: {
    fontSize: 13,
    color: "#757575",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 140,
    paddingTop: 16,
  },
  categoriesContainer: {
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#2E7D32",
    gap: 8,
  },
  typeButtonSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
  },
  typeButtonTextSelected: {
    color: "#FFFFFF",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: "#212121",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  locationButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#212121",
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 100,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B5E20",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#2E7D32",
    lineHeight: 20,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  publishButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

