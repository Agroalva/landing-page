import React from "react";
import { Image, View, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";

interface ConvexImageProps {
    storageId: Id<"_storage">;
    style?: any;
    placeholder?: React.ReactNode;
    resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}

export function ConvexImage({ 
    storageId, 
    style, 
    placeholder,
    resizeMode = "cover" 
}: ConvexImageProps) {
    const url = useQuery(api.storage.getDownloadUrl, { storageId });

    if (url === undefined) {
        // Loading state
        return (
            <View style={[styles.placeholder, style]}>
                <ActivityIndicator size="small" color="#9E9E9E" />
            </View>
        );
    }

    if (url === null) {
        // Error or missing image
        return placeholder || (
            <View style={[styles.placeholder, style]}>
                <Ionicons name="image-outline" size={32} color="#9E9E9E" />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: url }}
            style={style}
            resizeMode={resizeMode}
            onError={() => {
                // Image failed to load, but we'll show placeholder via error handling
                console.warn("Failed to load image:", storageId);
            }}
        />
    );
}

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
});

