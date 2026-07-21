import { Platform } from "react-native";
import * as TrackingTransparency from "expo-tracking-transparency";
import {
  AppEventsLogger,
  Settings,
  type Params,
} from "react-native-fbsdk-next";

const META_APP_ID = "3673329649472547";
const META_CLIENT_TOKEN = "eacdd29d99a0d0a2dce70bfcf9226151";
const META_APP_NAME = "AgroAlva";

type MetaEventParams = Record<string, string | number | boolean | null | undefined>;

let hasInitialized = false;
let currentUserId: string | null = null;

const toMetaParams = (params: MetaEventParams = {}): Params => {
  return Object.entries(params).reduce<Params>((normalized, [key, value]) => {
    if (value === null || value === undefined || value === "") {
      return normalized;
    }

    normalized[key] = typeof value === "boolean" ? Number(value) : value;
    return normalized;
  }, {});
};

const setMetaUserId = (userId?: string | null) => {
  const nextUserId = userId ?? null;
  if (currentUserId === nextUserId) {
    return;
  }

  currentUserId = nextUserId;
  AppEventsLogger.setUserID(nextUserId);
};

const syncAdvertiserTracking = async () => {
  if (Platform.OS !== "ios") {
    return;
  }

  const permission = await TrackingTransparency.getTrackingPermissionsAsync();
  const finalPermission =
    permission.status === "undetermined"
      ? await TrackingTransparency.requestTrackingPermissionsAsync()
      : permission;

  await Settings.setAdvertiserTrackingEnabled(finalPermission.status === "granted");
};

export const initializeMetaEvents = async (userId?: string | null) => {
  if (hasInitialized) {
    setMetaUserId(userId);
    return;
  }

  try {
    Settings.setAppID(META_APP_ID);
    Settings.setClientToken(META_CLIENT_TOKEN);
    Settings.setAppName(META_APP_NAME);
    Settings.setAutoLogAppEventsEnabled(true);
    Settings.setAdvertiserIDCollectionEnabled(true);
    await syncAdvertiserTracking().catch((error) => {
      console.warn("Failed to sync Meta advertiser tracking permission:", error);
    });
    Settings.initializeSDK();
    hasInitialized = true;
    setMetaUserId(userId);
  } catch (error) {
    console.warn("Failed to initialize Meta events:", error);
  }
};

export const trackMetaEvent = (
  eventName: string,
  params?: MetaEventParams,
  valueToSum?: number,
) => {
  try {
    const metaParams = toMetaParams(params);
    if (typeof valueToSum === "number") {
      AppEventsLogger.logEvent(eventName, valueToSum, metaParams);
      return;
    }

    AppEventsLogger.logEvent(eventName, metaParams);
  } catch (error) {
    console.warn(`Failed to track Meta event ${eventName}:`, error);
  }
};

export const trackSearch = (params: {
  query: string;
  topLevel: string;
  familyId?: string;
  categoryId?: string;
}) => {
  trackMetaEvent(AppEventsLogger.AppEvents.Searched, {
    [AppEventsLogger.AppEventParams.SearchString]: params.query,
    top_level: params.topLevel,
    family_id: params.familyId,
    category_id: params.categoryId,
  });
};

export const trackViewContent = (params: {
  productId: string;
  name: string;
  type: string;
  familyId?: string;
  categoryId?: string;
  price?: number;
  currency?: string;
}) => {
  trackMetaEvent(
    AppEventsLogger.AppEvents.ViewedContent,
    {
      [AppEventsLogger.AppEventParams.ContentID]: params.productId,
      [AppEventsLogger.AppEventParams.Content]: params.name,
      [AppEventsLogger.AppEventParams.ContentType]: params.type,
      [AppEventsLogger.AppEventParams.Currency]: params.currency,
      family_id: params.familyId,
      category_id: params.categoryId,
    },
    params.price,
  );
};

export const trackAddToWishlist = (params: {
  productId: string;
  type: string;
  familyId?: string;
  categoryId?: string;
}) => {
  trackMetaEvent(AppEventsLogger.AppEvents.AddedToWishlist, {
    [AppEventsLogger.AppEventParams.ContentID]: params.productId,
    [AppEventsLogger.AppEventParams.ContentType]: params.type,
    family_id: params.familyId,
    category_id: params.categoryId,
  });
};

export const trackCreatePost = (params: {
  productId: string;
  type: string;
  familyId?: string;
  categoryId?: string;
  hasPrice: boolean;
  hasLocation: boolean;
  mediaCount: number;
  price?: number;
  currency?: string;
}) => {
  trackMetaEvent(
    "create_post",
    {
      product_id: params.productId,
      content_type: params.type,
      family_id: params.familyId,
      category_id: params.categoryId,
      has_price: params.hasPrice,
      has_location: params.hasLocation,
      media_count: params.mediaCount,
      currency: params.currency,
    },
    params.price,
  );
};

export const trackContactSeller = (params: {
  method: "call" | "whatsapp" | "message";
  productId: string;
  type: string;
  familyId?: string;
  categoryId?: string;
}) => {
  trackMetaEvent(AppEventsLogger.AppEvents.Contact, {
    contact_method: params.method,
    product_id: params.productId,
    content_type: params.type,
    family_id: params.familyId,
    category_id: params.categoryId,
  });
};

export const trackShareProduct = (params: {
  productId: string;
  type: string;
  familyId?: string;
  categoryId?: string;
}) => {
  trackMetaEvent("share_product", {
    product_id: params.productId,
    content_type: params.type,
    family_id: params.familyId,
    category_id: params.categoryId,
  });
};

export const trackCompleteRegistration = () => {
  trackMetaEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
    [AppEventsLogger.AppEventParams.RegistrationMethod]: "email",
  });
};

export const trackLogin = () => {
  trackMetaEvent("login_completed", {
    method: "email",
  });
};
