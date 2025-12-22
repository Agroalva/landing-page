import React, { useEffect, useMemo, useState } from "react";
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
import * as Location from "expo-location";
import {
  AttributeDefinition,
  AttributeValueMap,
  CategoryDefinition,
  CategoryId,
  DEFAULT_FAMILY_ID,
  FamilyId,
  getCategoriesForFamily,
  getFamilies,
} from "./config/taxonomy";

export default function CreatePostScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const createProduct = useMutation(api.products.create);
  const { pickImage, uploading: uploadingImage } = useFileUpload();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"rent" | "sell">("sell");
  const families = useMemo(() => getFamilies(), []);
  const [familyId, setFamilyId] = useState<FamilyId>(DEFAULT_FAMILY_ID);
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState(false);
  const [mediaIds, setMediaIds] = useState<Id<"_storage">[]>([]);
  const [productLocation, setProductLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    label?: string;
    permissionStatus?: Location.PermissionStatus;
  } | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const handleSelectFamily = (nextFamilyId: FamilyId) => {
    setFamilyId(nextFamilyId);
    setCategoryId(null);
    setAttributeValues({});
  };

  const handleSelectCategory = (nextCategoryId: CategoryId) => {
    setCategoryId(nextCategoryId);
    setAttributeValues({});
  };

  const handleAttributeValueChange = (attributeId: string, value: any) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  const handleToggleAttributeOption = (attributeId: string, optionId: string) => {
    setAttributeValues((prev) => {
      const current: string[] = Array.isArray(prev[attributeId]) ? prev[attributeId] : [];
      const exists = current.includes(optionId);
      const next = exists ? current.filter((val) => val !== optionId) : [...current, optionId];
      return {
        ...prev,
        [attributeId]: next,
      };
    });
  };

  const handleRangeChange = (attributeId: string, field: "min" | "max", value: string) => {
    setAttributeValues((prev) => {
      const current = (prev[attributeId] as { min?: string; max?: string }) || {};
      return {
        ...prev,
        [attributeId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const buildAttributesPayload = (): AttributeValueMap | undefined => {
    if (!selectedCategory) {
      return undefined;
    }

    const payload: AttributeValueMap = {};

    selectedCategory.attributes.forEach((attribute) => {
      // Skip condition attribute for services (type === "rent")
      if (attribute.id === "condition" && type === "rent") {
        return;
      }
      // Skip year attribute for services (type === "rent")
      if (attribute.id === "year" && type === "rent") {
        return;
      }

      const rawValue = attributeValues[attribute.id];
      if (rawValue === undefined || rawValue === null) {
        return;
      }

      switch (attribute.type) {
        case "select":
        case "text": {
          if (typeof rawValue === "string" && rawValue.trim().length > 0) {
            payload[attribute.id] = rawValue.trim();
          }
          break;
        }
        case "multiselect": {
          if (Array.isArray(rawValue) && rawValue.length > 0) {
            payload[attribute.id] = rawValue;
          }
          break;
        }
        case "number": {
          const numericValue =
            typeof rawValue === "number" ? rawValue : parseFloat(rawValue);
          if (!Number.isNaN(numericValue)) {
            payload[attribute.id] = numericValue;
          }
          break;
        }
        case "numberRange": {
          const rangeValue = rawValue as { min?: string; max?: string };
          const parsedMin =
            rangeValue?.min && rangeValue.min !== "" ? parseFloat(rangeValue.min) : undefined;
          const parsedMax =
            rangeValue?.max && rangeValue.max !== "" ? parseFloat(rangeValue.max) : undefined;
          if (
            (parsedMin !== undefined && !Number.isNaN(parsedMin)) ||
            (parsedMax !== undefined && !Number.isNaN(parsedMax))
          ) {
            payload[attribute.id] = {
              ...(parsedMin !== undefined && !Number.isNaN(parsedMin) ? { min: parsedMin } : {}),
              ...(parsedMax !== undefined && !Number.isNaN(parsedMax) ? { max: parsedMax } : {}),
            };
          }
          break;
        }
        case "boolean": {
          if (typeof rawValue === "boolean") {
            payload[attribute.id] = rawValue;
          }
          break;
        }
        default:
          break;
      }
    });

    return Object.keys(payload).length > 0 ? payload : undefined;
  };

  const renderAttributeField = (attribute: AttributeDefinition) => {
    // Hide condition field for services (type === "rent")
    if (attribute.id === "condition" && type === "rent") {
      return null;
    }
    // Hide year field for services (type === "rent")
    if (attribute.id === "year" && type === "rent") {
      return null;
    }

    const labelContent = (
      <Text style={styles.label}>
        {attribute.label}
        {attribute.required && type === "sell" && <Text style={styles.required}>*</Text>}
      </Text>
    );

    const helperContent =
      attribute.helperText ? (
        <Text style={styles.helperText}>{attribute.helperText}</Text>
      ) : null;

    const value = attributeValues[attribute.id];

    switch (attribute.type) {
      case "select":
        return (
          <View key={attribute.id} style={styles.attributeGroup}>
            {labelContent}
            <View style={styles.attributeOptionsWrap}>
              {(attribute.options || []).map((option) => {
                const isSelected = value === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.attributeChip,
                      isSelected && styles.attributeChipSelected,
                    ]}
                    onPress={() => handleAttributeValueChange(attribute.id, option.id)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.attributeChipText,
                        isSelected && styles.attributeChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {helperContent}
          </View>
        );
      case "multiselect":
        return (
          <View key={attribute.id} style={styles.attributeGroup}>
            {labelContent}
            <View style={styles.attributeOptionsWrap}>
              {(attribute.options || []).map((option) => {
                const selectedValues: string[] = Array.isArray(value) ? value : [];
                const isSelected = selectedValues.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.attributeChip,
                      isSelected && styles.attributeChipSelected,
                    ]}
                    onPress={() => handleToggleAttributeOption(attribute.id, option.id)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.attributeChipText,
                        isSelected && styles.attributeChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {helperContent}
          </View>
        );
      case "number":
      case "text":
        return (
          <View key={attribute.id} style={styles.attributeGroup}>
            {labelContent}
            <TextInput
              style={styles.input}
              placeholder={attribute.placeholder || attribute.label}
              value={value ?? ""}
              onChangeText={(text) => handleAttributeValueChange(attribute.id, text)}
              placeholderTextColor="#9E9E9E"
              editable={!loading}
              keyboardType={attribute.type === "number" ? "numeric" : "default"}
            />
            {helperContent}
          </View>
        );
      case "numberRange":
        return (
          <View key={attribute.id} style={styles.attributeGroup}>
            {labelContent}
            <View style={styles.rangeInputRow}>
              <View style={styles.rangeInputWrapper}>
                <Text style={styles.rangeLabel}>Mín.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={value?.min ?? ""}
                  onChangeText={(text) => handleRangeChange(attribute.id, "min", text)}
                  placeholderTextColor="#9E9E9E"
                  editable={!loading}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.rangeInputWrapper, styles.rangeInputWrapperLast]}>
                <Text style={styles.rangeLabel}>Máx.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={value?.max ?? ""}
                  onChangeText={(text) => handleRangeChange(attribute.id, "max", text)}
                  placeholderTextColor="#9E9E9E"
                  editable={!loading}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {helperContent}
          </View>
        );
      case "boolean":
        return (
          <View key={attribute.id} style={styles.attributeGroup}>
            {labelContent}
            <View style={styles.booleanRow}>
              <TouchableOpacity
                style={[
                  styles.attributeChip,
                  value === true && styles.attributeChipSelected,
                ]}
                onPress={() => handleAttributeValueChange(attribute.id, true)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.attributeChipText,
                    value === true && styles.attributeChipTextSelected,
                  ]}
                >
                  Sí
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.attributeChip,
                  value === false && styles.attributeChipSelected,
                ]}
                onPress={() => handleAttributeValueChange(attribute.id, false)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.attributeChipText,
                    value === false && styles.attributeChipTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
            {helperContent}
          </View>
        );
      default:
        return null;
    }
  };

  const selectedFamily = useMemo(() => {
    return families.find((family) => family.id === familyId) ?? families[0];
  }, [families, familyId]);

  const availableCategories = useMemo(() => {
    return selectedFamily ? getCategoriesForFamily(selectedFamily.id as FamilyId) : [];
  }, [selectedFamily]);

  const selectedCategory: CategoryDefinition | null = useMemo(() => {
    if (!categoryId) {
      return availableCategories[0] ?? null;
    }
    return availableCategories.find((category) => category.id === categoryId) ?? null;
  }, [availableCategories, categoryId]);

  useEffect(() => {
    if (!categoryId && availableCategories.length > 0) {
      setCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, categoryId]);

  // Currency options with symbols
  const currencies = [
    { code: "USD", symbol: "$", name: "Dólar estadounidense" },
    { code: "ARS", symbol: "$", name: "Peso argentino" },
  ];

  const selectedCurrency = currencies.find((c) => c.code === currency) || currencies[0];

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

  const handleUseCurrentLocation = async () => {
    if (loading || requestingLocation) {
      return;
    }

    try {
      setRequestingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status);

      if (status !== "granted") {
        Alert.alert(
          "Permisos requeridos",
          "Necesitamos acceso a tu ubicación para adjuntarla a la publicación."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      let formattedAddress: string | undefined;
      let label: string | undefined;

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (reverse.length > 0) {
          const place = reverse[0];
          const cityParts = [place.city, place.region, place.country]
            .filter(Boolean)
            .join(", ");
          label = cityParts || place.name || place.street || undefined;
          formattedAddress = [
            place.name,
            place.street,
            place.city,
            place.region,
            place.country,
          ]
            .filter(Boolean)
            .join(", ");
        }
      } catch (error) {
        console.warn("reverseGeocode failed", error);
      }

      setProductLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        address: formattedAddress,
        label: label || formattedAddress,
        permissionStatus: status,
      });
    } catch (error: any) {
      Alert.alert(
        "Ubicación",
        error?.message || "No se pudo obtener la ubicación actual"
      );
    } finally {
      setRequestingLocation(false);
    }
  };

  const handleClearLocation = () => {
    setProductLocation(null);
  };

  const handlePublish = async () => {
    if (!name.trim() || !isAuthenticated) {
      Alert.alert("Error", "Por favor completa el nombre del producto");
      return;
    }

    if (!selectedFamily || !selectedCategory) {
      Alert.alert("Error", "Selecciona una familia y una categoría para publicar");
      return;
    }

    const attributesPayload = buildAttributesPayload();

    setLoading(true);
    try {
      await createProduct({ 
        name: name.trim(),
        description: description.trim() || undefined,
        type: type,
        category: selectedCategory.label,
        familyId: selectedFamily.id,
        categoryId: selectedCategory.id,
        attributes: attributesPayload,
        price: price ? parseFloat(price) : undefined,
        currency: price ? currency : undefined,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
        location: productLocation ? {
          latitude: productLocation.latitude,
          longitude: productLocation.longitude,
          accuracy: productLocation.accuracy,
          address: productLocation.address,
          label: productLocation.label,
        } : undefined,
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
              onPress={() => {
                setType("sell");
              }}
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
              onPress={() => {
                setType("rent");
                // Clear condition value when switching to services
                if (attributeValues.condition !== undefined) {
                  setAttributeValues((prev) => {
                    const updated = { ...prev };
                    delete updated.condition;
                    return updated;
                  });
                }
              }}
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
                Servicios
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Familia</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {families
              .filter((family) => {
                // Hide "Personal" family for sell posts (only show for services/rent)
                if (family.id === "personal" && type === "sell") {
                  return false;
                }
                return true;
              })
              .map((family) => {
                const isSelected = selectedFamily?.id === family.id;
                return (
                  <TouchableOpacity
                    key={family.id}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => handleSelectFamily(family.id as FamilyId)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={family.icon as any}
                      size={16}
                      color={isSelected ? "#FFFFFF" : family.color}
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                      ]}
                    >
                      {family.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoría</Text>
          {availableCategories.length === 0 ? (
            <Text style={styles.helperText}>
              No hay categorías disponibles para esta familia
            </Text>
          ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
              {availableCategories.map((category) => {
                const isSelected = selectedCategory?.id === category.id;
              return (
                <TouchableOpacity
                    key={category.id}
                  style={[
                    styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                  ]}
                    onPress={() => handleSelectCategory(category.id)}
                  disabled={loading}
                >
                  <Ionicons
                      name={category.icon as any}
                    size={16}
                      color={isSelected ? "#FFFFFF" : category.color}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                    ]}
                  >
                      {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          )}
        </View>

        {selectedCategory && selectedCategory.attributes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Características específicas</Text>
            {selectedCategory.attributes.map((attribute) => renderAttributeField(attribute))}
          </View>
        )}

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Precio (opcional)</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
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
          <View style={styles.currencySelectorContainer}>
            <Text style={styles.currencyLabel}>Moneda:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.currenciesContainer}
            >
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyChip,
                    currency === curr.code && styles.currencyChipSelected,
                  ]}
                  onPress={() => setCurrency(curr.code)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      currency === curr.code && styles.currencyChipTextSelected,
                    ]}
                  >
                    {curr.code} {curr.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Ubicación (opcional)</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              (loading || requestingLocation) && styles.locationButtonDisabled,
            ]}
            onPress={handleUseCurrentLocation}
            disabled={loading || requestingLocation}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={productLocation ? "#2E7D32" : "#757575"}
            />
            <Text style={styles.locationButtonText}>
              {productLocation
                ? productLocation.label || "Ubicación guardada"
                : "Usar mi ubicación actual"}
            </Text>
            {requestingLocation && (
              <ActivityIndicator size="small" color="#2E7D32" />
            )}
          </TouchableOpacity>
          {productLocation && (
            <View style={styles.locationSummary}>
              <Text style={styles.locationDetails}>
                {productLocation.address ||
                  `${productLocation.latitude.toFixed(3)}, ${productLocation.longitude.toFixed(3)}`}
              </Text>
              <TouchableOpacity onPress={handleClearLocation}>
                <Text style={styles.clearLocationText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          )}
          {locationStatus === "denied" && (
            <Text style={styles.helperText}>
              Otorga permisos en la configuración del dispositivo para adjuntar
              tu ubicación.
            </Text>
          )}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  categoryIcon: {
    marginRight: 0,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
  attributeGroup: {
    marginBottom: 16,
  },
  attributeOptionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  attributeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 8,
  },
  attributeChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  attributeChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#212121",
  },
  attributeChipTextSelected: {
    color: "#FFFFFF",
  },
  rangeInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeInputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  rangeInputWrapperLast: {
    marginRight: 0,
  },
  rangeLabel: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 6,
  },
  booleanRow: {
    flexDirection: "row",
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
  currencySelectorContainer: {
    marginTop: 12,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#757575",
    marginBottom: 8,
  },
  currenciesContainer: {
    paddingBottom: 4,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
  },
  currencyChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  currencyChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#212121",
  },
  currencyChipTextSelected: {
    color: "#FFFFFF",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#212121",
  },
  locationSummary: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  locationDetails: {
    fontSize: 14,
    color: "#424242",
    marginBottom: 8,
  },
  clearLocationText: {
    fontSize: 13,
    color: "#F44336",
    fontWeight: "600",
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

