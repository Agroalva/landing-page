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
  }),
});

export function useNotifications() {
  const { user, isAuthenticated } = useAuthSession();
  const updateProfile = useMutation(api.users.updateProfile);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Request permissions
    registerForPushNotificationsAsync(updateProfile);

    // Handle notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Handle user tapping on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        // Handle navigation based on notification type
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, user, updateProfile]);

  return null;
}

async function registerForPushNotificationsAsync(
  updateProfile: (args: { pushToken?: string }) => Promise<any>
) {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2E7D32",
    });
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }

  try {
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

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Push token:", token);

    // Store token in profile
    if (token) {
      await updateProfile({ pushToken: token });
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
  }

  return token;
}
