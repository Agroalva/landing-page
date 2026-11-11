import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Id } from "../convex/_generated/dataModel";
import { ConvexImage } from "@/components/ConvexImage";

interface ImageViewerModalProps {
  storageId: Id<"_storage"> | null;
  onClose: () => void;
}

/**
 * Full-screen viewer for an image stored in Convex. Pinch to zoom on iOS.
 */
export function ImageViewerModal({ storageId, onClose }: ImageViewerModalProps) {
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={!!storageId}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        {storageId && (
          <ScrollView
            style={StyleSheet.absoluteFill}
            contentContainerStyle={styles.zoomContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <ConvexImage
              storageId={storageId}
              style={{ width, height }}
              resizeMode="contain"
            />
          </ScrollView>
        )}
        <SafeAreaView edges={["top"]} style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar foto"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000",
  },
  zoomContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "flex-end",
  },
  closeButton: {
    margin: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
