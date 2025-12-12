import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
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

export function useNotifications() {
  const { user, isAuthenticated } = useAuthSession();
  const updateProfile = useMutation(api.users.updateProfile);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Skip push notifications in Expo Go (they don't work properly)
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      // We're in Expo Go - skip push notifications
      if (__DEV__) {
        console.log("Skipping push notifications: Expo Go doesn't fully support push notifications. Use a development build for full functionality.");
      }
      return;
    }

    // Request permissions with error handling
    registerForPushNotificationsAsync(updateProfile).catch((error) => {
      // Only log as warning in dev, not as error
      if (__DEV__) {
        console.warn("Failed to register for push notifications:", error?.message || error);
      }
      // Don't crash the app if notification registration fails
    });

    // Handle notifications received while app is foregrounded
    try {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });
    } catch (error) {
      if (__DEV__) {
        console.warn("Failed to add notification received listener:", error);
      }
    }

    // Handle user tapping on notification
    try {
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
          // Handle navigation based on notification type
        });
    } catch (error) {
      if (__DEV__) {
        console.warn("Failed to add notification response listener:", error);
      }
    }

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (error) {
          // Silently fail on cleanup errors
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (error) {
          // Silently fail on cleanup errors
        }
      }
    };
  }, [isAuthenticated, user, updateProfile]);

  return null;
}

async function registerForPushNotificationsAsync(
  updateProfile: (args: { pushToken?: string }) => Promise<any>
) {
  let token;

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
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Get projectId from Constants (can be in extra.eas.projectId or easConfig.projectId)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.extra?.projectId ||
                      Constants.easConfig?.projectId;
    
    // Skip push token if no projectId (required for push notifications)
    // In Expo Go, projectId is not available, so push notifications won't work
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

      // Store token in profile
      if (token) {
        try {
          await updateProfile({ pushToken: token });
        } catch (error) {
          if (__DEV__) {
            console.warn("Failed to update profile with push token:", error);
          }
          // Don't throw - token was obtained successfully, just couldn't save it
        }
      }
    } catch (error: any) {
      // Handle errors gracefully - don't log as error for expected failures
      const errorMessage = error?.message || String(error);
      
      // Check for common expected errors
      if (
        errorMessage.includes("projectId") ||
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Expo token") ||
        errorMessage.includes("not supported in Expo Go")
      ) {
        // These are expected in Expo Go or when projectId is missing
        if (__DEV__) {
          console.log("Push notifications not available:", errorMessage.includes("Network") 
            ? "Network error (common in Expo Go)" 
            : "ProjectId required. Configure in app.json under 'extra.eas.projectId' or use a development build.");
        }
      } else {
        // Unexpected error - log as warning in dev only
        if (__DEV__) {
          console.warn("Error getting push token:", errorMessage);
        }
      }
      // Don't throw - allow app to continue without push notifications
    }
  } catch (error) {
    // Catch any unexpected errors - only log in dev as warning
    if (__DEV__) {
      console.warn("Unexpected error in registerForPushNotificationsAsync:", error);
    }
    // Don't throw - allow app to continue without push notifications
  }

  return token;
}
