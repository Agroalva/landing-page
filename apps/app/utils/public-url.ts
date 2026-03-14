import { Id } from "../convex/_generated/dataModel";

const DEFAULT_WEB_URL = "https://www.agroalva.com.ar";

const normalizeBaseUrl = (baseUrl?: string) => {
    const trimmedBaseUrl = baseUrl?.trim();
    return (trimmedBaseUrl || DEFAULT_WEB_URL).replace(/\/+$/, "");
};

export const getPublicWebBaseUrl = () => normalizeBaseUrl(process.env.EXPO_PUBLIC_WEB_URL);

export const buildPublicProductUrl = (productId: Id<"products"> | string) =>
    `${getPublicWebBaseUrl()}/product/${productId}`;
