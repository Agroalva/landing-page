import type { ProductType } from "./listing-intents";

export const LISTING_STATUSES = ["active", "paused", "sold", "rented"] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

// Products created before listing statuses existed (or by old app versions
// through older code paths) have no `status` field: they are active.
export const getListingStatus = (status?: ListingStatus | null): ListingStatus =>
  status ?? "active";

export const isListingActive = (status?: ListingStatus | null) =>
  getListingStatus(status) === "active";

// "Sell" listings close as sold; "rent" listings (Servicios and Personal) close as rented.
export const getClosedStatusForType = (type: ProductType): ListingStatus =>
  type === "sell" ? "sold" : "rented";

export const isClosedStatus = (status?: ListingStatus | null) => {
  const resolved = getListingStatus(status);
  return resolved === "sold" || resolved === "rented";
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Activa",
  paused: "Pausada",
  sold: "Vendido",
  rented: "Alquilado",
};

export const LISTING_STATUS_ACTION_LABELS: Record<ListingStatus, string> = {
  active: "Reactivar",
  paused: "Pausar",
  sold: "Marcar como vendido",
  rented: "Marcar como alquilado",
};

// Shown to visitors on the product detail when the listing is not active.
export const LISTING_STATUS_VISITOR_MESSAGES: Record<ListingStatus, string> = {
  active: "",
  paused: "El vendedor pausó esta publicación. Por ahora no está disponible para contactar.",
  sold: "Esta publicación ya fue vendida y no está disponible.",
  rented: "Esta publicación ya fue alquilada y no está disponible.",
};

// Shown to the author on the product detail when the listing is not active.
export const LISTING_STATUS_OWNER_MESSAGES: Record<ListingStatus, string> = {
  active: "Tu publicación está visible en el inicio y en las búsquedas.",
  paused: "Tu publicación está pausada: no aparece en el inicio ni en las búsquedas. Reactivala cuando quieras.",
  sold: "Marcaste esta publicación como vendida: ya no aparece en el inicio ni en las búsquedas.",
  rented: "Marcaste esta publicación como alquilada: ya no aparece en el inicio ni en las búsquedas.",
};

export type ListingStatusTransition = {
  status: ListingStatus;
  label: string;
  confirmTitle?: string;
  confirmMessage?: string;
};

// Actions the author can take from the current status.
export const getListingStatusTransitions = (
  type: ProductType,
  status?: ListingStatus | null,
): ListingStatusTransition[] => {
  const current = getListingStatus(status);
  const closedStatus = getClosedStatusForType(type);
  const closeTransition: ListingStatusTransition = {
    status: closedStatus,
    label: LISTING_STATUS_ACTION_LABELS[closedStatus],
    confirmTitle: LISTING_STATUS_ACTION_LABELS[closedStatus],
    confirmMessage:
      "La publicación dejará de aparecer en el inicio y en las búsquedas. Vas a conservar las visitas y los favoritos, y podés reactivarla cuando quieras.",
  };
  const reactivate: ListingStatusTransition = {
    status: "active",
    label: LISTING_STATUS_ACTION_LABELS.active,
  };
  const pause: ListingStatusTransition = {
    status: "paused",
    label: LISTING_STATUS_ACTION_LABELS.paused,
  };

  if (current === "active") {
    return [pause, closeTransition];
  }

  if (current === "paused") {
    return [reactivate, closeTransition];
  }

  return [reactivate];
};
