import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
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

    // Request permissions with error handling
    registerForPushNotificationsAsync(updateProfile).catch((error) => {
      console.error("Failed to register for push notifications:", error);
      // Don't crash the app if notification registration fails
    });

    // Handle notifications received while app is foregrounded
    try {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });
    } catch (error) {
      console.error("Failed to add notification received listener:", error);
    }

    // Handle user tapping on notification
    try {
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
          // Handle navigation based on notification type
        });
    } catch (error) {
      console.error("Failed to add notification response listener:", error);
    }

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (error) {
          console.error("Failed to remove notification listener:", error);
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (error) {
          console.error("Failed to remove response listener:", error);
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
        console.error("Failed to set notification channel:", error);
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
      console.error("Failed to get or request permissions:", error);
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
      console.log("Push token:", token);

      // Store token in profile
      if (token) {
        try {
          await updateProfile({ pushToken: token });
        } catch (error) {
          console.error("Failed to update profile with push token:", error);
          // Don't throw - token was obtained successfully, just couldn't save it
        }
      }
    } catch (error: any) {
      // Handle errors gracefully
      if (error?.message?.includes("projectId")) {
        if (__DEV__) {
          console.log("Push notifications require a projectId. Configure in app.json under 'extra.eas.projectId' or use a development build.");
        }
      } else {
        console.error("Error getting push token:", error);
      }
      // Don't throw - allow app to continue without push notifications
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in registerForPushNotificationsAsync:", error);
    // Don't throw - allow app to continue without push notifications
  }

  return token;
}
