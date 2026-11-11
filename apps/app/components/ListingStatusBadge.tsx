import React from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getListingStatus,
  LISTING_STATUS_LABELS,
  type ListingStatus,
} from "../config/listing-status";

export const LISTING_STATUS_COLORS: Record<ListingStatus, { background: string; text: string }> = {
  active: { background: "#E8F5E9", text: "#1B5E20" },
  paused: { background: "#FFF3E0", text: "#E65100" },
  sold: { background: "#ECEFF1", text: "#37474F" },
  rented: { background: "#ECEFF1", text: "#37474F" },
};

const STATUS_ICONS: Record<ListingStatus, keyof typeof Ionicons.glyphMap> = {
  active: "radio-button-on",
  paused: "pause-circle",
  sold: "checkmark-done-circle",
  rented: "checkmark-done-circle",
};

interface ListingStatusBadgeProps {
  status?: ListingStatus;
  style?: StyleProp<ViewStyle>;
}

export function ListingStatusBadge({ status, style }: ListingStatusBadgeProps) {
  const resolved = getListingStatus(status);
  const colors = LISTING_STATUS_COLORS[resolved];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }, style]}>
      <Ionicons name={STATUS_ICONS[resolved]} size={13} color={colors.text} />
      <Text style={[styles.text, { color: colors.text }]}>{LISTING_STATUS_LABELS[resolved]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
