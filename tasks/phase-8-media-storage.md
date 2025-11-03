# Phase 8 — Media Storage (Optional but Recommended)

## Overview
Implement file upload functionality using Convex file storage for images and videos in posts, messages, and user profiles.

## Tasks

### 1. Create Storage Functions
Create `apps/app/convex/storage.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Generate upload URL for client
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        return await ctx.storage.generateUploadUrl();
    },
});

// Get download URL for a stored file
export const getDownloadUrl = query({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        return await ctx.storage.getUrl(args.storageId);
    },
});

// Delete a stored file
export const deleteFile = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Optional: Check if user owns the file before deleting
        // This would require tracking file ownership in your schema

        await ctx.storage.delete(args.storageId);
    },
});
```

### 2. Create Upload Helper Hook
Create `apps/app/hooks/use-file-upload.ts`:

```typescript
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export function useFileUpload() {
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file: { uri: string; type: string; name: string }) => {
        setUploading(true);
        setProgress(0);

        try {
            // Get upload URL from Convex
            const uploadUrl = await generateUploadUrl();

            // Read file as blob
            const response = await fetch(file.uri);
            const blob = await response.blob();

            // Upload to Convex storage
            const uploadResponse = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: blob,
            });

            if (!uploadResponse.ok) {
                throw new Error("Upload failed");
            }

            const { storageId } = await uploadResponse.json();
            setProgress(100);
            return storageId;
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            return await uploadFile({
                uri: asset.uri,
                type: "image/jpeg",
                name: `image-${Date.now()}.jpg`,
            });
        }

        return null;
    };

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            return await uploadFile({
                uri: asset.uri,
                type: "video/mp4",
                name: `video-${Date.now()}.mp4`,
            });
        }

        return null;
    };

    return {
        uploadFile,
        pickImage,
        pickVideo,
        uploading,
        progress,
    };
}
```

### 3. Update Create Post Screen
Update `apps/app/app/create-post.tsx`:

```typescript
import { useFileUpload } from "@/hooks/use-file-upload";
import { useState } from "react";

export default function CreatePostScreen() {
    const { pickImage, uploading: uploadingMedia } = useFileUpload();
    const [mediaIds, setMediaIds] = useState<string[]>([]);

    const handleAddImage = async () => {
        const storageId = await pickImage();
        if (storageId) {
            setMediaIds([...mediaIds, storageId]);
        }
    };

    const handleSubmit = async () => {
        await createPost({
            text: text.trim(),
            mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
        });
    };

    // ... rest of UI with image picker button
}
```

### 4. Update Chat Screen for Media
Update `apps/app/app/chat/[id].tsx`:

```typescript
import { useFileUpload } from "@/hooks/use-file-upload";

export default function ChatScreen() {
    const { pickImage, pickVideo } = useFileUpload();

    const handleSendMedia = async (type: "image" | "video") => {
        const storageId = type === "image" 
            ? await pickImage() 
            : await pickVideo();
        
        if (storageId) {
            await sendMessage({
                conversationId,
                text: "",
                mediaId: storageId,
            });
        }
    };

    // ... rest of UI with media buttons
}
```

### 5. Create Image Component
Create `apps/app/components/ConvexImage.tsx`:

```typescript
import { Image } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function ConvexImage({ storageId }: { storageId: Id<"_storage"> }) {
    const url = useQuery(api.storage.getDownloadUrl, { storageId });

    if (!url) {
        return <PlaceholderImage />;
    }

    return <Image source={{ uri: url }} style={{ width: 100, height: 100 }} />;
}
```

### 6. Update Profile Screen for Avatar
Update `apps/app/app/(tabs)/profile.tsx`:

```typescript
import { useFileUpload } from "@/hooks/use-file-upload";

export default function ProfileScreen() {
    const { pickImage } = useFileUpload();

    const handleChangeAvatar = async () => {
        const storageId = await pickImage();
        if (storageId) {
            await updateProfile({ avatarId: storageId });
        }
    };

    // ... rest of UI with avatar picker
}
```

## Verification Checklist
- [ ] Storage functions created
- [ ] File upload hook implemented
- [ ] Image picker integrated in create post
- [ ] Media support added to chat
- [ ] Avatar upload works in profile
- [ ] Images display correctly using download URLs
- [ ] Upload progress shown to user
- [ ] Error handling for failed uploads

## Installation Requirements

### Expo Packages
Install required packages:

```bash
pnpm add expo-image-picker expo-document-picker
```

### Permissions
Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow access to your photos",
          "cameraPermission": "Allow access to your camera"
        }
      ]
    ]
  }
}
```

## Notes

### File Size Limits
- Convex has file size limits (check current limits)
- Consider compressing images before upload
- For videos, consider using a CDN or external storage

### Storage Costs
- Convex storage has usage-based pricing
- Consider cleanup for old/unused files
- Implement file deletion when posts/messages are deleted

### Performance
- Use thumbnails for large images
- Lazy load images in lists
- Cache download URLs when possible

### Security
- Validate file types on server side
- Check file sizes before upload
- Scan for malicious content (optional)

## Optional Enhancements
- Image compression before upload
- Video transcoding
- Multiple file uploads with progress
- Drag and drop for web version
- Image editing/cropping before upload

