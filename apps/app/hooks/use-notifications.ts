import { useCallback, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { router, type Href } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useAuthSession } from "./use-session";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type RegisterPushToken = (args: {
  token: string;
  platform?: "ios" | "android" | "web";
}) => Promise<unknown>;
type LegacyUpdateProfile = (args: { pushToken?: string }) => Promise<unknown>;
type UnregisterPushToken = (args: { token: string }) => Promise<unknown>;

// Token registered by this device in the current session (used on sign out).
let currentPushToken: string | null = null;
// Notification responses already handled (avoid navigating twice for the same tap).
const handledResponseIds = new Set<string>();

const ALLOWED_ROUTE_PREFIXES = ["/chat/", "/product/", "/user-profile/"];

type PushData = {
  type?: string;
  relatedId?: string;
  notificationId?: string;
  url?: string;
};

function getRouteForNotification(data: PushData): string | null {
  if (
    typeof data.url === "string" &&
    ALLOWED_ROUTE_PREFIXES.some((prefix) => data.url!.startsWith(prefix))
  ) {
    return data.url;
  }
  if (!data.relatedId) {
    return null;
  }
  const id = encodeURIComponent(data.relatedId);
  switch (data.type) {
    case "message":
      return `/chat/${id}`;
    case "favorite":
      return `/product/${id}`;
    case "review":
      return `/user-profile/${id}`;
    default:
      return null;
  }
}

function isPushSupported() {
  // Expo Go doesn't fully support push notifications
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.expoConfig?.extra?.projectId ||
    Constants.easConfig?.projectId
  );
}

function getPlatform(): "ios" | "android" | "web" | undefined {
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
    return Platform.OS;
  }
  return undefined;
}

export function useNotifications() {
  const { user, isAuthenticated } = useAuthSession();
  const userId = user?.id ?? null;
  const registerPushToken = useMutation(api.notifications.registerPushToken);
  const updateProfile = useMutation(api.users.updateProfile);
  const markAsRead = useMutation(api.notifications.markAsRead);

  // Register this device's push token
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    if (!isPushSupported()) {
      if (__DEV__) {
        console.log("Skipping push notifications: Expo Go doesn't fully support push notifications. Use a development build for full functionality.");
      }
      return;
    }

    registerForPushNotificationsAsync(registerPushToken, updateProfile).catch((error) => {
      if (__DEV__) {
        console.warn("Failed to register for push notifications:", error?.message || error);
      }
    });
  }, [isAuthenticated, userId, registerPushToken, updateProfile]);

  // Handle taps on notifications (including the one that cold-started the app)
  useEffect(() => {
    if (!isAuthenticated || !userId || !isPushSupported()) return;

    let isMounted = true;

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!isMounted || !response) return;
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

      const responseId = response.notification.request.identifier;
      if (handledResponseIds.has(responseId)) return;
      handledResponseIds.add(responseId);
      try {
        // So a later normal launch doesn't re-open this notification's screen
        Notifications.clearLastNotificationResponse();
      } catch {
        // Not critical
      }

      const data = (response.notification.request.content.data ?? {}) as PushData;

      if (typeof data.notificationId === "string") {
        markAsRead({ notificationId: data.notificationId as Id<"notifications"> }).catch(
          (error) => {
            if (__DEV__) {
              console.warn("Failed to mark notification as read:", error);
            }
          }
        );
      }

      const route = getRouteForNotification(data);
      if (!route) return;
      try {
        router.push(route as Href);
      } catch (error) {
        if (__DEV__) {
          console.warn("Failed to navigate from notification:", error);
        }
      }
    };

    let subscription: Notifications.Subscription | null = null;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    } catch (error) {
      if (__DEV__) {
        console.warn("Failed to add notification response listener:", error);
      }
    }

    Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch((error) => {
        if (__DEV__) {
          console.warn("Failed to get last notification response:", error);
        }
      });

    return () => {
      isMounted = false;
      try {
        subscription?.remove();
      } catch {
        // Silently fail on cleanup errors
      }
    };
  }, [isAuthenticated, userId, markAsRead]);

  return null;
}

/**
 * Returns a function that removes this device's push token from the current
 * account. Call it before signing out so the device stops receiving pushes.
 * Never throws and never blocks sign-out for more than a few seconds.
 */
export function useUnregisterPushToken() {
  const unregisterPushToken = useMutation(api.notifications.unregisterPushToken);

  return useCallback(async () => {
    await unregisterCurrentPushToken(unregisterPushToken);
  }, [unregisterPushToken]);
}

async function unregisterCurrentPushToken(unregister: UnregisterPushToken) {
  const token = currentPushToken;
  if (!token) return;
  try {
    await Promise.race([
      unregister({ token }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    currentPushToken = null;
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to unregister push token:", error);
    }
  }
}

/**
 * Asks for notification permission (if needed) and registers the token.
 * Returns whether notifications are permitted on this device.
 */
export function useEnablePushOnDevice() {
  const registerPushToken = useMutation(api.notifications.registerPushToken);
  const updateProfile = useMutation(api.users.updateProfile);

  return useCallback(async () => {
    if (!isPushSupported()) return false;
    const token = await registerForPushNotificationsAsync(registerPushToken, updateProfile);
    if (token) return true;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  }, [registerPushToken, updateProfile]);
}

async function savePushToken(
  token: string,
  registerPushToken: RegisterPushToken,
  updateProfile: LegacyUpdateProfile
) {
  try {
    await registerPushToken({ token, platform: getPlatform() });
  } catch (error) {
    if (__DEV__) {
      console.warn("registerPushToken failed, falling back to updateProfile:", error);
    }
    // Fallback for backends that don't have registerPushToken yet
    await updateProfile({ pushToken: token });
  }
  currentPushToken = token;
}

async function registerForPushNotificationsAsync(
  registerPushToken: RegisterPushToken,
  updateProfile: LegacyUpdateProfile
) {
  let token: string | undefined;

  try {
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#2E7D32",
        });
      } catch (error) {
        if (__DEV__) {
          console.warn("Failed to set notification channel:", error);
        }
        // Continue even if channel setup fails
      }
    }

    let finalStatus;
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("Failed to get or request permissions:", error);
      }
      return;
    }

    if (finalStatus !== "granted") {
      if (__DEV__) {
        console.log("Push notification permission not granted");
      }
      return;
    }

    const projectId = getProjectId();

    // Skip push token if no projectId (required for push notifications)
    if (!projectId) {
      if (__DEV__) {
        console.log("Skipping push token registration: projectId not found. Push notifications require a development build or projectId in app.json");
      }
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (__DEV__) {
        console.log("Push token obtained successfully");
      }

      if (token) {
        try {
          await savePushToken(token, registerPushToken, updateProfile);
        } catch (error) {
          if (__DEV__) {
            console.warn("Failed to save push token:", error);
          }
          // Don't throw - token was obtained successfully, just couldn't save it
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);

      if (
        errorMessage.includes("projectId") ||
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Expo token") ||
        errorMessage.includes("not supported in Expo Go")
      ) {
        if (__DEV__) {
          console.log("Push notifications not available:", errorMessage.includes("Network")
            ? "Network error (common in Expo Go)"
            : "ProjectId required. Configure in app.json under 'extra.eas.projectId' or use a development build.");
        }
      } else if (__DEV__) {
        console.warn("Error getting push token:", errorMessage);
      }
      // Don't throw - allow app to continue without push notifications
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("Unexpected error in registerForPushNotificationsAsync:", error);
    }
  }

  return token;
}
