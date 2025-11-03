# Phase 6 — Wire Expo Screens to Convex

## Overview
Connect existing Expo screens to Convex queries and mutations, replacing any mock data or placeholder logic with real Convex data.

## Tasks

### 1. Feed Screen (index.tsx)
Update `apps/app/app/(tabs)/index.tsx`:

```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PostList } from "@/components/PostList"; // Adjust import path

export default function FeedScreen() {
    const posts = useQuery(api.posts.feed, { limit: 20 });

    if (posts === undefined) {
        return <LoadingSpinner />;
    }

    return <PostList posts={posts} />;
}
```

### 2. Create Post Screen
Update `apps/app/app/create-post.tsx`:

```typescript
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { router } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";

export default function CreatePostScreen() {
    const { isAuthenticated } = useAuthSession();
    const createPost = useMutation(api.posts.create);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim() || !isAuthenticated) {
            return;
        }

        setLoading(true);
        try {
            await createPost({ text: text.trim() });
            router.back();
        } catch (error) {
            console.error("Failed to create post:", error);
            // Show error to user
        } finally {
            setLoading(false);
        }
    };

    // ... rest of UI
}
```

### 3. Messages Screen
Update `apps/app/app/(tabs)/messages.tsx`:

```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";
import { router } from "expo-router";

export default function MessagesScreen() {
    const { isAuthenticated, isLoading: authLoading } = useAuthSession();
    const conversations = useQuery(api.conversations.listForUser);

    if (authLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        router.replace("/(auth)/sign-in");
        return null;
    }

    if (conversations === undefined) {
        return <LoadingSpinner />;
    }

    return (
        <ConversationList
            conversations={conversations}
            onSelect={(conversationId) => {
                router.push(`/chat/${conversationId}`);
            }}
        />
    );
}
```

### 4. Chat Screen
Update `apps/app/app/chat/[id].tsx`:

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const conversationId = id as any; // Type assertion, improve with proper type

    const messages = useQuery(
        api.conversations.listMessages,
        { conversationId, limit: 50 }
    );
    const sendMessage = useMutation(api.conversations.sendMessage);

    const [text, setText] = useState("");

    const handleSend = async () => {
        if (!text.trim()) return;

        try {
            await sendMessage({
                conversationId,
                text: text.trim(),
            });
            setText("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    // ... rest of UI
}
```

### 5. Profile Screen
Update `apps/app/app/(tabs)/profile.tsx`:

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";
import { useState } from "react";

export default function ProfileScreen() {
    const { user } = useAuthSession();
    const profile = useQuery(api.users.getMe);
    const updateProfile = useMutation(api.users.updateProfile);
    const userPosts = useQuery(
        api.posts.byUser,
        user ? { userId: user.id } : "skip"
    );

    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(profile?.displayName || "");

    const handleSave = async () => {
        try {
            await updateProfile({ displayName });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
        }
    };

    // ... rest of UI
}
```

### 6. Search Screen
Update `apps/app/app/(tabs)/search.tsx`:

```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const results = useQuery(
        api.search.querySearch,
        searchQuery ? { query: searchQuery, limit: 20 } : "skip"
    );

    return (
        <View>
            <TextInput
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {results && (
                <>
                    <PostList posts={results.posts} />
                    <ProfileList profiles={results.profiles} />
                </>
            )}
        </View>
    );
}
```

## Verification Checklist
- [ ] Feed screen loads and displays posts
- [ ] Create post screen successfully creates posts
- [ ] Messages screen lists conversations
- [ ] Chat screen displays messages and sends new ones
- [ ] Profile screen shows user data and allows updates
- [ ] Search screen performs searches
- [ ] Loading states handled properly
- [ ] Error states handled gracefully
- [ ] Navigation works correctly after mutations

## Integration Notes

### Loading States
- `useQuery` returns `undefined` while loading
- Check for `undefined` before rendering data
- Show loading spinners or skeletons

### Error Handling
- Wrap mutations in try/catch
- Show user-friendly error messages
- Log errors for debugging

### Real-time Updates
- Convex queries automatically update when data changes
- No need to manually refetch after mutations
- Multiple screens will stay in sync automatically

### Authentication Guards
- Use `useAuthSession` hook to check auth state
- Redirect to sign-in if not authenticated
- Pass `"skip"` to queries when user is not available

### Type Safety
- Import `api` from `convex/_generated/api`
- TypeScript will autocomplete function names and args
- Use proper types for IDs (e.g., `Id<"posts">`)

## Next Steps
After this phase:
- Test all screens end-to-end
- Add error boundaries if needed
- Consider adding optimistic updates for better UX
- Add pagination for large lists

