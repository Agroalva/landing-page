import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchWeatherLocations, WeatherLocation } from "@/lib/field-pulse";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: WeatherLocation) => void;
};

export function WeatherLocationPicker({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = query.trim();

  useEffect(() => {
    if (!visible || search.length < 2) {
      setLocations([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setLocations([]);
    setIsSearching(true);
    const timer = setTimeout(async () => {
      setError(null);

      try {
        const result = await searchWeatherLocations(search, controller.signal);
        if (!controller.signal.aborted) {
          setLocations(result);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLocations([]);
          setError(cause instanceof Error ? cause.message : "No pudimos buscar localidades.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>CLIMA LOCAL</Text>
            <Text style={styles.title}>Elegí una localidad</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar búsqueda de localidades"
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color="#1F1A14" />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#6A5F50" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar localidad"
            placeholderTextColor="#8B8175"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Buscar localidad"
            style={styles.searchInput}
          />
          {isSearching ? <ActivityIndicator color="#1B5E20" /> : null}
        </View>

        {error ? <Text style={styles.message}>{error}</Text> : null}
        {!error && search.length < 2 ? (
          <Text style={styles.message}>Escribí al menos 2 letras.</Text>
        ) : null}
        {!error && search.length >= 2 && !isSearching && locations.length === 0 ? (
          <Text style={styles.message}>No encontramos localidades. Probá con otro nombre.</Text>
        ) : null}

        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`Usar ${item.label} para el clima`}
              style={styles.locationRow}
            >
              <Ionicons name="location-outline" size={19} color="#1B5E20" />
              <Text style={styles.locationLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#8B8175" />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF8" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: { color: "#1B5E20", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#1F1A14", fontSize: 23, fontWeight: "800", marginTop: 4 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    height: 50,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E0D0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, height: "100%", color: "#1F1A14", fontSize: 16 },
  message: { color: "#6A5F50", fontSize: 13, marginHorizontal: 22, marginTop: 20 },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  locationRow: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#EFE9DF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationLabel: { flex: 1, color: "#1F1A14", fontSize: 14, fontWeight: "600" },
});
