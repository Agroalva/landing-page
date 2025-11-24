import { Ionicons } from "@expo/vector-icons";

export type CategoryIcon = keyof typeof Ionicons.glyphMap;

export interface CategoryMetadata {
  name: string;
  icon: CategoryIcon;
  color: string;
}

// Category metadata mapping - used for display purposes
export const CATEGORY_METADATA: Record<string, CategoryMetadata> = {
  Maquinaria: {
    name: "Maquinaria",
    icon: "construct",
    color: "#2E7D32",
  },
  Semillas: {
    name: "Semillas",
    icon: "leaf",
    color: "#FBC02D",
  },
  Servicios: {
    name: "Servicios",
    icon: "people",
    color: "#2E7D32",
  },
  Fertilizantes: {
    name: "Fertilizantes",
    icon: "flask",
    color: "#FBC02D",
  },
  Transporte: {
    name: "Transporte",
    icon: "car",
    color: "#2E7D32",
  },
  Herramientas: {
    name: "Herramientas",
    icon: "hammer",
    color: "#FBC02D",
  },
  Otros: {
    name: "Otros",
    icon: "ellipse",
    color: "#757575",
  },
};

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

