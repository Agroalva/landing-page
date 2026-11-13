import type { Doc } from "@/lib/convex-api";

// Builds the catalog URL (home page filters) that reproduces a saved search.
export function savedSearchToHref(search: Doc<"savedSearches">) {
    const params = new URLSearchParams();
    const set = (key: string, value: string | number | undefined) => {
        if (value !== undefined && value !== "") {
            params.set(key, String(value));
        }
    };

    set("q", search.query);
    set("type", search.listingType);
    set("family", search.familyId);
    set("category", search.categoryId);
    if (search.minPrice !== undefined || search.maxPrice !== undefined) {
        set("currency", search.priceCurrency === "ARS" ? "ARS" : undefined);
        set("minPrice", search.minPrice);
        set("maxPrice", search.maxPrice);
    }
    set("minYear", search.minYear);
    set("maxYear", search.maxYear);
    if (search.near) {
        set("lat", search.near.latitude.toFixed(3));
        set("lng", search.near.longitude.toFixed(3));
        set("radius", Math.round(search.near.radiusKm));
    }
    if (search.sort && search.sort !== "recent") {
        set("sort", search.sort);
    }

    const query = params.toString();
    return `/${query ? `?${query}` : ""}#catalogo`;
}

// Same value the mobile search screen stores in `topLevel`.
export function getSavedSearchTopLevel(view: "all" | "products" | "services" | "personnel") {
    if (view === "products") return "products";
    if (view === "services") return "services";
    if (view === "personnel") return "personal";
    return undefined;
}
