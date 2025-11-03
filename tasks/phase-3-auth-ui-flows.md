# Phase 3 — Auth UI Flows (Expo)

## Overview
Implement the user-facing authentication screens and protect routes that require authentication.

## Tasks

### 1. Create Auth Screens Directory Structure
Create authentication screens under `apps/app/app/(auth)/`:

```
apps/app/app/(auth)/
  ├── _layout.tsx
  ├── sign-in.tsx
  ├── sign-up.tsx
  └── account.tsx (optional, for profile management)
```

### 2. Implement Sign In Screen
Create `apps/app/app/(auth)/sign-in.tsx`:

```typescript
import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";

export default function SignInScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        try {
            await authClient.signIn.email({
                email,
                password,
            });
            router.replace("/(tabs)");
        } catch (error) {
            Alert.alert("Error", "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Sign In" onPress={handleSignIn} disabled={loading} />
        </View>
    );
}
```

### 3. Implement Sign Up Screen
Create `apps/app/app/(auth)/sign-up.tsx`:

```typescript
import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";

export default function SignUpScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        try {
            await authClient.signUp.email({
                email,
                password,
            });
            router.replace("/(tabs)");
        } catch (error) {
            Alert.alert("Error", "Failed to sign up");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Sign Up" onPress={handleSignUp} disabled={loading} />
        </View>
    );
}
```

### 4. Create Auth Layout
Create `apps/app/app/(auth)/_layout.tsx`:

```typescript
import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack>
            <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
            <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
        </Stack>
    );
}
```

### 5. Implement Session Hook
Create `apps/app/hooks/use-session.ts`:

```typescript
import { useSession } from "better-auth/react";

export function useAuthSession() {
    const { data: session, isPending } = useSession({
        fetchOptions: {
            credentials: "include",
        },
    });

    return {
        user: session?.user,
        isLoading: isPending,
        isAuthenticated: !!session?.user,
    };
}
```

### 6. Protect Routes
Update protected screens to check authentication:

**Example for `apps/app/app/(tabs)/messages.tsx`:**

```typescript
import { useAuthSession } from "@/hooks/use-session";
import { router } from "expo-router";
import { useEffect } from "react";

export default function MessagesScreen() {
    const { isAuthenticated, isLoading } = useAuthSession();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/(auth)/sign-in");
        }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return null;
    }

    // ... rest of component
}
```

### 7. Add Sign Out Functionality
Add sign out to profile screen or settings:

```typescript
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";

const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/(auth)/sign-in");
};
```

## Verification Checklist
- [ ] Sign in screen created and functional
- [ ] Sign up screen created and functional
- [ ] Auth layout configured
- [ ] Session hook implemented
- [ ] Protected routes redirect to sign-in when not authenticated
- [ ] Sign out functionality works
- [ ] Navigation flows correctly after auth actions

## Screens to Protect
Based on your existing screens, protect these routes:
- `(tabs)/messages.tsx`
- `(tabs)/profile.tsx`
- `create-post.tsx`
- `chat/[id].tsx`

## Notes
- Use Expo Router's `router.replace()` to prevent back navigation after auth
- Consider adding loading states and better error handling
- You may want to style these screens to match your app's design system
- Consider adding password validation and email format checking
- For production, add email verification flow (currently disabled in Phase 1)

