import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ListingSort = "recent" | "price_asc" | "price_desc" | "distance";
export type PriceCurrency = "USD" | "ARS";

export type SearchPoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type SearchFilterDraft = {
  sort: ListingSort;
  priceCurrency: PriceCurrency;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  radiusKm: number | null;
  near: SearchPoint | null;
};

export const EMPTY_FILTER_DRAFT: SearchFilterDraft = {
  sort: "recent",
  priceCurrency: "USD",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  radiusKm: null,
  near: null,
};

export type AppliedSearchFilters = {
  sort: ListingSort;
  priceCurrency?: PriceCurrency;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  near?: SearchPoint & { radiusKm: number };
};

export const RADIUS_OPTIONS_KM = [50, 100, 200] as const;

const SORT_OPTIONS: { id: ListingSort; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "recent", label: "Más recientes", icon: "time-outline" },
  { id: "distance", label: "Más cerca", icon: "navigate-outline" },
  { id: "price_asc", label: "Menor precio", icon: "arrow-down-outline" },
  { id: "price_desc", label: "Mayor precio", icon: "arrow-up-outline" },
];

// Accepts "1.500.000" or "1500000"; decimals are irrelevant for these filters.
export const parseIntegerInput = (text: string) => {
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }
  const value = Number(digits);
  return Number.isFinite(value) ? value : undefined;
};

export const toAppliedFilters = (draft: SearchFilterDraft): AppliedSearchFilters => {
  const minPrice = parseIntegerInput(draft.minPrice);
  const maxPrice = parseIntegerInput(draft.maxPrice);
  const hasPrice = minPrice !== undefined || maxPrice !== undefined;
  const near = draft.radiusKm && draft.near
    ? { ...draft.near, radiusKm: draft.radiusKm }
    : undefined;

  return {
    // "Más cerca" needs a location; without one fall back to recency.
    sort: draft.sort === "distance" && !near ? "recent" : draft.sort,
    priceCurrency: hasPrice ? draft.priceCurrency : undefined,
    minPrice,
    maxPrice,
    minYear: parseIntegerInput(draft.minYear),
    maxYear: parseIntegerInput(draft.maxYear),
    near,
  };
};

export const countActiveRangeFilters = (filters: AppliedSearchFilters) =>
  (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
  (filters.minYear !== undefined || filters.maxYear !== undefined ? 1 : 0);

export const hasAdvancedFilters = (filters: AppliedSearchFilters) =>
  filters.sort !== "recent" || countActiveRangeFilters(filters) > 0 || filters.near !== undefined;

type Props = {
  draft: SearchFilterDraft;
  onChange: (draft: SearchFilterDraft) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  activeRangeCount: number;
  showYear: boolean;
  usdArsRate?: number | null;
  showRateNote: boolean;
  onSelectRadius: (radiusKm: number | null) => void;
  isLocating: boolean;
};

export function SearchFiltersPanel({
  draft,
  onChange,
  expanded,
  onToggleExpanded,
  activeRangeCount,
  showYear,
  usdArsRate,
  showRateNote,
  onSelectRadius,
  isLocating,
}: Props) {
  const update = (changes: Partial<SearchFilterDraft>) => onChange({ ...draft, ...changes });
  const hasRangeDraft = Boolean(
    draft.minPrice || draft.maxPrice || draft.minYear || draft.maxYear,
  );

  const hasNear = Boolean(draft.radiusKm && draft.near);
  const visibleSortOptions = SORT_OPTIONS.filter((option) => option.id !== "distance" || hasNear);

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.chip, !hasNear && styles.chipActive]}
          onPress={() => onSelectRadius(null)}
          disabled={isLocating}
        >
          <Ionicons name="globe-outline" size={14} color={!hasNear ? "#FFFFFF" : "#1B5E20"} />
          <Text style={[styles.chipText, !hasNear && styles.chipTextActive]}>Cualquier distancia</Text>
        </TouchableOpacity>
        {RADIUS_OPTIONS_KM.map((radius) => {
          const isActive = hasNear && draft.radiusKm === radius;
          return (
            <TouchableOpacity
              key={radius}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelectRadius(radius)}
              disabled={isLocating}
              accessibilityLabel={`Publicaciones a menos de ${radius} kilómetros`}
            >
              <Ionicons name="location-outline" size={14} color={isActive ? "#FFFFFF" : "#1B5E20"} />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{radius} km</Text>
            </TouchableOpacity>
          );
        })}
        {isLocating && <ActivityIndicator size="small" color="#1B5E20" />}
      </View>
      {hasNear && (
        <Text style={styles.hint}>
          {`Cerca de ${draft.near?.label || "tu ubicación"}. Las publicaciones sin ubicación no aparecen con este filtro.`}
        </Text>
      )}

      <View style={styles.sortRow}>
        {visibleSortOptions.map((option) => {
          const isActive = draft.sort === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => update({ sort: option.id })}
            >
              <Ionicons name={option.icon} size={14} color={isActive ? "#FFFFFF" : "#1B5E20"} />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.chip, activeRangeCount > 0 && styles.chipActive]}
          onPress={onToggleExpanded}
          accessibilityLabel="Filtros de precio y año"
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={activeRangeCount > 0 ? "#FFFFFF" : "#1B5E20"}
          />
          <Text style={[styles.chipText, activeRangeCount > 0 && styles.chipTextActive]}>
            {activeRangeCount > 0 ? `Filtros (${activeRangeCount})` : "Filtros"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={activeRangeCount > 0 ? "#FFFFFF" : "#1B5E20"}
          />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.panel}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Precio</Text>
            <View style={styles.currencyToggle}>
              {(["USD", "ARS"] as const).map((currency) => {
                const isActive = draft.priceCurrency === currency;
                return (
                  <TouchableOpacity
                    key={currency}
                    style={[styles.currencyOption, isActive && styles.currencyOptionActive]}
                    onPress={() => update({ priceCurrency: currency })}
                  >
                    <Text style={[styles.currencyText, isActive && styles.currencyTextActive]}>
                      {currency === "USD" ? "US$" : "AR$"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.rangeRow}>
            <TextInput
              style={styles.input}
              placeholder="Desde"
              placeholderTextColor="#9E9E9E"
              keyboardType="number-pad"
              value={draft.minPrice}
              onChangeText={(minPrice) => update({ minPrice })}
            />
            <Text style={styles.rangeSeparator}>–</Text>
            <TextInput
              style={styles.input}
              placeholder="Hasta"
              placeholderTextColor="#9E9E9E"
              keyboardType="number-pad"
              value={draft.maxPrice}
              onChangeText={(maxPrice) => update({ maxPrice })}
            />
          </View>

          {showYear && (
            <>
              <Text style={styles.fieldLabel}>Año de fabricación</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Desde"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={draft.minYear}
                  onChangeText={(minYear) => update({ minYear })}
                />
                <Text style={styles.rangeSeparator}>–</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hasta"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={draft.maxYear}
                  onChangeText={(maxYear) => update({ maxYear })}
                />
              </View>
              <Text style={styles.hint}>Solo se muestran publicaciones que indican el año.</Text>
            </>
          )}

          {hasRangeDraft && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => update({ minPrice: "", maxPrice: "", minYear: "", maxYear: "" })}
            >
              <Ionicons name="close-circle-outline" size={16} color="#1B5E20" />
              <Text style={styles.clearText}>Limpiar precio y año</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showRateNote && (
        <Text style={styles.hint}>
          {usdArsRate
            ? `Pesos y dólares se comparan con el dólar oficial (US$1 = AR$${Math.round(usdArsRate).toLocaleString("es-AR")}).`
            : "Sin cotización disponible: solo se comparan publicaciones en la misma moneda."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFDF8",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED3C2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#1B5E20",
    borderColor: "#1B5E20",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F1A14",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  panel: {
    backgroundColor: "#FFFDF8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6DDCC",
    padding: 14,
    gap: 10,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F1A14",
  },
  currencyToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED3C2",
    overflow: "hidden",
  },
  currencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currencyOptionActive: {
    backgroundColor: "#1B5E20",
  },
  currencyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B5E20",
  },
  currencyTextActive: {
    color: "#FFFFFF",
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeSeparator: {
    color: "#8D8375",
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E6DDCC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#212121",
    backgroundColor: "#FFFFFF",
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: "#6A5F50",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B5E20",
  },
});
