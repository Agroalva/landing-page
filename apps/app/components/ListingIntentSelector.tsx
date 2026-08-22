import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  LISTING_INTENT_OPTIONS,
} from "@/config/listing-intents";
import type { ListingIntent } from "@/config/listing-intents";

interface ListingIntentSelectorProps {
  value: ListingIntent;
  onChange: (intent: ListingIntent) => void;
  disabled?: boolean;
}

export function ListingIntentSelector({
  value,
  onChange,
  disabled = false,
}: ListingIntentSelectorProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.container}>
      {LISTING_INTENT_OPTIONS.map((option) => {
        const isSelected = value === option.id;
        const foregroundColor = isSelected ? "#FFFFFF" : option.accent;

        return (
          <TouchableOpacity
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            activeOpacity={0.8}
            disabled={disabled}
            onPress={() => onChange(option.id)}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? option.accent : option.surface,
                borderColor: option.accent,
              },
              disabled && styles.optionDisabled,
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.18)"
                    : "#FFFFFF",
                },
              ]}
            >
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={foregroundColor}
              />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: foregroundColor }]}>
                {option.label}
              </Text>
              <Text
                style={[
                  styles.description,
                  {
                    color: isSelected
                      ? "rgba(255,255,255,0.88)"
                      : "#455A64",
                  },
                ]}
              >
                {option.description}
              </Text>
            </View>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={foregroundColor}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  option: {
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
});
