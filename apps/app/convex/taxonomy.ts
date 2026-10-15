import { CATEGORY_IDS, FAMILY_IDS, getFamilyForCategory } from "../config/taxonomy";
import type { CategoryId, FamilyId } from "../config/taxonomy";

const FAMILY_ID_SET = new Set<FamilyId>(FAMILY_IDS);
const CATEGORY_ID_SET = new Set<CategoryId>(CATEGORY_IDS as CategoryId[]);

export const resolveTaxonomyFilter = (familyId?: string | null, categoryId?: string | null) => {
    let resolvedFamily: FamilyId | undefined;
    let resolvedCategory: CategoryId | undefined;

    if (familyId) {
        if (!FAMILY_ID_SET.has(familyId as FamilyId)) {
            throw new Error("La familia seleccionada no es válida");
        }
        resolvedFamily = familyId as FamilyId;
    }

    if (categoryId) {
        if (!CATEGORY_ID_SET.has(categoryId as CategoryId)) {
            throw new Error("La categoría seleccionada no es válida");
        }
        resolvedCategory = categoryId as CategoryId;
        const inferredFamily = getFamilyForCategory(resolvedCategory);
        if (inferredFamily) {
            if (resolvedFamily && resolvedFamily !== inferredFamily.id) {
                throw new Error("La categoría no pertenece a la familia seleccionada");
            }
            resolvedFamily = inferredFamily.id as FamilyId;
        }
    }

    return { resolvedFamily, resolvedCategory };
};

const PERSONAL_FAMILY_ID: FamilyId = "personal";

// Servicios and Personal listings are both stored as type "rent"; only the family
// tells them apart. A "rent" request without a family comes from the Servicios
// view, so Personal listings must be left out of it.
export const shouldExcludePersonalListings = (
    listingType?: "rent" | "sell",
    resolvedFamily?: FamilyId,
) => listingType === "rent" && !resolvedFamily;

export const excludePersonalListings = (queryBuilder: any) =>
    queryBuilder.filter((q: any) => q.neq(q.field("familyId"), PERSONAL_FAMILY_ID));
