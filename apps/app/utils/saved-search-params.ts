type SavedSearchLike = {
  query?: string;
  topLevel?: string;
  familyId?: string;
  categoryId?: string;
  listingType?: "rent" | "sell";
  sort?: string;
  priceCurrency?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
};

const toParam = (value?: string | number) => (value === undefined ? "" : String(value));

const deriveTopLevel = (search: SavedSearchLike) => {
  if (search.topLevel) {
    return search.topLevel;
  }
  if (search.familyId === "personal") {
    return "personal";
  }
  if (search.listingType === "sell") {
    return "products";
  }
  if (search.listingType === "rent") {
    return "services";
  }
  return "all";
};

/**
 * Search-tab params that reproduce a saved search. Every key is always sent
 * (empty when unset) so opening a search never inherits values from the
 * previous one, and `restore` forces the screen to re-apply them.
 */
export function buildSavedSearchParams(search: SavedSearchLike): Record<string, string> {
  return {
    topLevel: deriveTopLevel(search),
    familyId: toParam(search.familyId),
    categoryId: toParam(search.categoryId),
    query: toParam(search.query),
    sort: toParam(search.sort),
    currency: toParam(search.priceCurrency),
    minPrice: toParam(search.minPrice),
    maxPrice: toParam(search.maxPrice),
    minYear: toParam(search.minYear),
    maxYear: toParam(search.maxYear),
    restore: String(Date.now()),
  };
}
