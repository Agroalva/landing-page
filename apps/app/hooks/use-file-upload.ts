import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import * as ImagePicker from "expo-image-picker";
import { Id } from "../convex/_generated/dataModel";

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

    return {
        uploadFile,
        pickImage,
        pickImageFromCamera,
        uploading,
        progress,
    };
}

