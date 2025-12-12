import { Ionicons } from "@expo/vector-icons";

export type CategoryIcon = keyof typeof Ionicons.glyphMap;

export interface CategoryMetadata {
  name: string;
  icon: CategoryIcon;
  color: string;
}

// Category metadata mapping - used for display purposes
export const CATEGORY_METADATA: Record<string, CategoryMetadata> = {
  Campo: {
    name: "Campo",
    icon: "leaf",
    color: "#2E7D32",
  },
  Maquinarias: {
    name: "Maquinarias",
    icon: "construct",
    color: "#2E7D32",
  },
  Transporte: {
    name: "Transporte",
    icon: "car",
    color: "#2E7D32",
  },
  "Contratación de Personal": {
    name: "Contratación de Personal",
    icon: "people",
    color: "#2E7D32",
  },
  Vehículos: {
    name: "Vehículos",
    icon: "car-sport",
    color: "#2E7D32",
  },
  Otros: {
    name: "Otros",
    icon: "ellipse",
    color: "#757575",
  },
};

// Categories for rent type (Servicios)
export const RENT_CATEGORIES = [
  "Campo",
  "Maquinarias",
  "Transporte",
  "Contratación de Personal",
];

// Categories for sell type (Compra-Venta)
export const SELL_CATEGORIES = [
  "Campo",
  "Maquinarias",
  "Vehículos",
];

// Default metadata for unknown categories
export const DEFAULT_CATEGORY_METADATA: CategoryMetadata = {
  name: "Otros",
  icon: "ellipse",
  color: "#757575",
};

// Get category metadata, with fallback to default
export function getCategoryMetadata(categoryName: string | undefined | null): CategoryMetadata {
  if (!categoryName) {
    return DEFAULT_CATEGORY_METADATA;
  }
  return CATEGORY_METADATA[categoryName] || DEFAULT_CATEGORY_METADATA;
}

// Get categories for a specific product type
export function getCategoriesForType(type: "rent" | "sell"): string[] {
  return type === "rent" ? RENT_CATEGORIES : SELL_CATEGORIES;
}

