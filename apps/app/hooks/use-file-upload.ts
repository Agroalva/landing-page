import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Id } from "../convex/_generated/dataModel";

export type ImageSource = "camera" | "library";

export type SelectedImage = {
    uri: string;
    width: number;
    height: number;
};

// Longest side (px) for images sent in chat. Keeps text in photos of documents
// readable while bringing multi-megabyte camera shots down to a few hundred KB.
const COMPRESS_MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.7;

/**
 * Downscale (if needed) and re-encode an image as JPEG before uploading.
 * Falls back to the original image if manipulation fails.
 */
export async function compressImage(image: SelectedImage): Promise<SelectedImage> {
    try {
        const longestSide = Math.max(image.width, image.height);
        const actions: ImageManipulator.Action[] = [];
        if (longestSide > COMPRESS_MAX_DIMENSION) {
            actions.push({
                resize:
                    image.width >= image.height
                        ? { width: COMPRESS_MAX_DIMENSION }
                        : { height: COMPRESS_MAX_DIMENSION },
            });
        }
        const result = await ImageManipulator.manipulateAsync(image.uri, actions, {
            compress: COMPRESS_QUALITY,
            format: ImageManipulator.SaveFormat.JPEG,
        });
        return { uri: result.uri, width: result.width, height: result.height };
    } catch (error) {
        console.warn("Image compression failed, using original:", error);
        return image;
    }
}

/**
 * Let the user pick an image (camera or library) without uploading it, so the
 * caller can show a preview first. Returns null if cancelled or permission was
 * denied (`permissionDenied` tells which).
 */
export async function selectImage(
    source: ImageSource
): Promise<{ image: SelectedImage | null; permissionDenied: boolean }> {
    const permission =
        source === "camera"
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        return { image: null, permissionDenied: true };
    }

    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
    };
    const result =
        source === "camera"
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]) {
        return { image: null, permissionDenied: false };
    }

    const asset = result.assets[0];
    return {
        image: { uri: asset.uri, width: asset.width, height: asset.height },
        permissionDenied: false,
    };
}

export function useFileUpload() {
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file: { uri: string; type: string; name: string }): Promise<Id<"_storage"> | null> => {
        setUploading(true);
        setProgress(0);

        try {
            // Get upload URL from Convex
            const uploadUrl = await generateUploadUrl();

            // Read file as blob
            const response = await fetch(file.uri);
            const blob = await response.blob();

            // Determine valid content type - use blob type if available, otherwise use provided type or default
            let contentType = blob.type || file.type || "image/jpeg";
            
            // Validate content type format (must be valid MIME type)
            if (!contentType || !contentType.includes("/")) {
                // Infer from file extension if type is invalid
                const extension = file.name.split(".").pop()?.toLowerCase();
                const mimeTypes: Record<string, string> = {
                    jpg: "image/jpeg",
                    jpeg: "image/jpeg",
                    png: "image/png",
                    gif: "image/gif",
                    webp: "image/webp",
                };
                contentType = mimeTypes[extension || ""] || "image/jpeg";
            }

            // Upload to Convex storage
            const uploadResponse = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": contentType },
                body: blob,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error("Upload failed:", uploadResponse.status, errorText);
                throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
            }

            // Convex storage returns JSON with storageId property
            const { storageId } = await uploadResponse.json();
            setProgress(100);
            return storageId as Id<"_storage">;
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const pickImage = async (): Promise<Id<"_storage"> | null> => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                return await uploadFile({
                    uri: asset.uri,
                    type: asset.type || "image/jpeg",
                    name: `image-${Date.now()}.jpg`,
                });
            }

            return null;
        } catch (error) {
            console.error("Image picker error:", error);
            throw error;
        }
    };

    const pickImageFromCamera = async (): Promise<Id<"_storage"> | null> => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                return await uploadFile({
                    uri: asset.uri,
                    type: asset.type || "image/jpeg",
                    name: `image-${Date.now()}.jpg`,
                });
            }

            return null;
        } catch (error) {
            console.error("Camera error:", error);
            throw error;
        }
    };

    // Compress a previously selected image and upload it to Convex storage.
    const uploadCompressedImage = async (image: SelectedImage): Promise<Id<"_storage"> | null> => {
        const compressed = await compressImage(image);
        return await uploadFile({
            uri: compressed.uri,
            type: "image/jpeg",
            name: `image-${Date.now()}.jpg`,
        });
    };

    return {
        uploadFile,
        uploadCompressedImage,
        pickImage,
        pickImageFromCamera,
        uploading,
        progress,
    };
}

