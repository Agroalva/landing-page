import { CATEGORY_IDS, FAMILY_IDS, getFamilyForCategory } from "../app/config/taxonomy";
import type { CategoryId, FamilyId } from "../app/config/taxonomy";

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

