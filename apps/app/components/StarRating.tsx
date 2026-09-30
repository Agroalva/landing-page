import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type StarRatingProps = {
    value: number;
    onChange?: (value: number) => void;
    size?: number;
    reviewCount?: number;
    showValue?: boolean;
};

export function StarRating({
    value,
    onChange,
    size = 20,
    reviewCount,
    showValue = false,
}: StarRatingProps) {
    const isInteractive = Boolean(onChange);

    const getIconName = (star: number) => {
        if (value >= star) {
            return "star";
        }
        if (!isInteractive && value >= star - 0.75) {
            return "star-half";
        }
        return "star-outline";
    };

    return (
        <View
            style={styles.container}
            accessibilityRole={isInteractive ? "adjustable" : "text"}
            accessibilityLabel={`${value.toFixed(isInteractive ? 0 : 1)} de 5 estrellas`}
        >
            <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        disabled={!isInteractive}
                        onPress={() => onChange?.(star)}
                        accessibilityRole={isInteractive ? "button" : undefined}
                        accessibilityLabel={`${star} de 5 estrellas`}
                        hitSlop={isInteractive ? 8 : undefined}
                        style={isInteractive ? styles.starButton : undefined}
                    >
                        <Ionicons
                            name={getIconName(star)}
                            size={size}
                            color="#F9A825"
                        />
                    </TouchableOpacity>
                ))}
            </View>
            {showValue && value > 0 && (
                <Text style={styles.valueText}>{value.toFixed(1)}</Text>
            )}
            {reviewCount !== undefined && (
                <Text style={styles.countText}>
                    {reviewCount === 1 ? "1 reseña" : `${reviewCount} reseñas`}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    stars: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    starButton: {
        padding: 3,
    },
    valueText: {
        color: "#212121",
        fontSize: 14,
        fontWeight: "700",
    },
    countText: {
        color: "#757575",
        fontSize: 13,
    },
});
