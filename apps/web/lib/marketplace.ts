export type MarketplaceListing = {
    _id: string;
    authorId: string;
    name: string;
    description?: string;
    type: "rent" | "sell";
    category?: string;
    familyId?: string;
    categoryId?: string;
    price?: number;
    currency?: string;
    location?: { address?: string; label?: string };
    primaryImageUrl?: string;
    seller: {
        userId: string;
        displayName: string;
        bio?: string;
        avatarUrl?: string;
    };
    viewCount: number;
    createdAt: number;
    updatedAt: number;
};

export type MarketplaceProduct = MarketplaceListing & {
    attributes?: Record<string, string | number | boolean | string[] | { min?: number; max?: number }>;
    imageUrls: string[];
    mediaIds: string[];
    isOwner: boolean;
    isFavorite: boolean;
};

export function formatPrice(price?: number, currency = "ARS") {
    if (price === undefined) {
        return "Consultar";
    }
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatShortDate(timestamp: number) {
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(timestamp);
}
