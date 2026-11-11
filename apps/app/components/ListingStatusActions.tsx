import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  getListingStatusTransitions,
  type ListingStatus,
  type ListingStatusTransition,
} from "../config/listing-status";

const TRANSITION_ICONS: Record<ListingStatus, keyof typeof Ionicons.glyphMap> = {
  active: "play-circle-outline",
  paused: "pause-circle-outline",
  sold: "checkmark-done-circle-outline",
  rented: "checkmark-done-circle-outline",
};

interface ListingStatusActionsProps {
  productId: Id<"products">;
  type: "rent" | "sell";
  status?: ListingStatus;
  style?: StyleProp<ViewStyle>;
}

export function ListingStatusActions({
  productId,
  type,
  status,
  style,
}: ListingStatusActionsProps) {
  const updateStatus = useMutation(api.products.updateStatus);
  const [pendingStatus, setPendingStatus] = useState<ListingStatus | null>(null);
  const transitions = getListingStatusTransitions(type, status);

  const applyTransition = async (transition: ListingStatusTransition) => {
    setPendingStatus(transition.status);
    try {
      await updateStatus({ productId, status: transition.status });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo actualizar la publicación");
    } finally {
      setPendingStatus(null);
    }
  };

  const handlePress = (transition: ListingStatusTransition) => {
    if (!transition.confirmTitle) {
      void applyTransition(transition);
      return;
    }

    Alert.alert(transition.confirmTitle, transition.confirmMessage, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => void applyTransition(transition) },
    ]);
  };

  return (
    <View style={[styles.container, style]}>
      {transitions.map((transition, index) => {
        const isPrimary = index === 0;
        const isPending = pendingStatus === transition.status;
        return (
          <TouchableOpacity
            key={transition.status}
            style={[styles.button, isPrimary ? styles.primaryButton : styles.secondaryButton]}
            onPress={() => handlePress(transition)}
            disabled={pendingStatus !== null}
            activeOpacity={0.7}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={isPrimary ? "#FFFFFF" : "#2E7D32"} />
            ) : (
              <Ionicons
                name={TRANSITION_ICONS[transition.status]}
                size={18}
                color={isPrimary ? "#FFFFFF" : "#2E7D32"}
              />
            )}
            <Text
              style={[styles.buttonText, isPrimary ? styles.primaryText : styles.secondaryText]}
              numberOfLines={1}
            >
              {transition.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#2E7D32",
  },
});
