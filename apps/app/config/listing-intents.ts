export type ListingIntent = "products" | "services" | "personal";

export type ProductType = "sell" | "rent";

export const LISTING_INTENT_OPTIONS = [
  {
    id: "products",
    label: "Compra y Venta",
    description: "Publica maquinaria, vehículos, repuestos y otros artículos.",
    icon: "cube-outline",
    accent: "#1B5E20",
    surface: "#E8F5E9",
  },
  {
    id: "services",
    label: "Servicios",
    description: "Ofrece maquinaria, transporte o trabajos para contratar.",
    icon: "construct-outline",
    accent: "#0D47A1",
    surface: "#E3F2FD",
  },
  {
    id: "personal",
    label: "Personal",
    description: "Publica empleo, oficios o búsqueda de personal.",
    icon: "people-outline",
    accent: "#8E24AA",
    surface: "#F3E5F5",
  },
] as const satisfies readonly {
  id: ListingIntent;
  label: string;
  description: string;
  icon: string;
  accent: string;
  surface: string;
}[];

export const getProductTypeForIntent = (intent: ListingIntent): ProductType =>
  intent === "products" ? "sell" : "rent";

export const getListingIntentForProduct = (
  type: ProductType,
  familyId?: string | null,
): ListingIntent => {
  if (familyId === "personal") {
    return "personal";
  }

  return type === "sell" ? "products" : "services";
};

export const isFamilyAvailableForIntent = (
  familyId: string,
  intent: ListingIntent,
) => {
  if (intent === "personal") {
    return familyId === "personal";
  }

  if (intent === "services") {
    return familyId !== "vehicles" && familyId !== "personal";
  }

  return familyId !== "personal";
};
