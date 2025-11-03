# Phase 7 — Realtime Presence (Optional)

## Overview
Add real-time presence indicators (online/offline status, typing indicators) to enhance the chat experience.

## Tasks

### 1. Add Presence Schema
Update `apps/app/convex/schema.ts` to add presence table:

```typescript
// Add to schema
presence: defineTable({
    userId: v.string(),
    conversationId: v.optional(v.id("conversations")),
    status: v.union(v.literal("online"), v.literal("typing"), v.literal("offline")),
    lastSeen: v.number(),
})
    .index("by_userId", ["userId"])
    .index("by_conversationId", ["conversationId"]),
```

### 2. Create Presence Functions
Create `apps/app/convex/presence.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Set user's presence status
export const setPresence = mutation({
    args: {
        conversationId: v.optional(v.id("conversations")),
        status: v.union(v.literal("online"), v.literal("typing"), v.literal("offline")),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Find existing presence record
        const existing = await ctx.db
            .query("presence")
            .withIndex("by_userId", (q) => q.eq("userId", user.id))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                conversationId: args.conversationId,
                status: args.status,
                lastSeen: Date.now(),
            });
        } else {
            await ctx.db.insert("presence", {
                userId: user.id,
                conversationId: args.conversationId,
                status: args.status,
                lastSeen: Date.now(),
            });
        }
    },
});

// Get presence for users in a conversation
export const getPresence = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.memberIds.includes(user.id)) {
            return [];
        }

        // Get presence for all members
        const presenceRecords = await ctx.db
            .query("presence")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        // Filter to only members of this conversation
        return presenceRecords.filter(p =>
            conversation.memberIds.includes(p.userId)
        );
    },
});

// Clean up stale presence (call periodically)
export const cleanupPresence = mutation({
    args: {},
    handler: async (ctx) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        const stalePresence = await ctx.db
            .query("presence")
            .filter((q) => q.lt(q.field("lastSeen"), fiveMinutesAgo))
            .collect();

        for (const record of stalePresence) {
            await ctx.db.delete(record._id);
        }
    },
});
```

### 3. Create Scheduled Task for Cleanup
Update `apps/app/convex/tasks.ts` or create new cron:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up stale presence every 5 minutes
crons.interval(
    "cleanup-presence",
    { minutes: 5 },
    internal.presence.cleanupPresence
);

export default crons;
```

### 4. Add Presence Hooks in Expo
Create `apps/app/hooks/use-presence.ts`:

```typescript
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthSession } from "./use-session";

export function usePresence(conversationId?: string) {
    const { user } = useAuthSession();
    const setPresence = useMutation(api.presence.setPresence);
    const presence = useQuery(
        api.presence.getPresence,
        conversationId ? { conversationId } : "skip"
    );

    // Set online status when component mounts
    useEffect(() => {
        if (!user || !conversationId) return;

        setPresence({ conversationId, status: "online" });

        // Set offline when component unmounts
        return () => {
            setPresence({ conversationId, status: "offline" });
        };
    }, [user, conversationId, setPresence]);

    // Refresh presence periodically
    useEffect(() => {
        if (!user || !conversationId) return;

        const interval = setInterval(() => {
            setPresence({ conversationId, status: "online" });
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [user, conversationId, setPresence]);

    return presence;
}

export function useTyping(conversationId: string) {
    const { user } = useAuthSession();
    const setPresence = useMutation(api.presence.setPresence);

    const startTyping = () => {
        if (!user) return;
        setPresence({ conversationId, status: "typing" });
    };

    const stopTyping = () => {
        if (!user) return;
        setPresence({ conversationId, status: "online" });
    };

    return { startTyping, stopTyping };
}
```

### 5. Integrate in Chat Screen
Update `apps/app/app/chat/[id].tsx`:

```typescript
import { usePresence, useTyping } from "@/hooks/use-presence";

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const conversationId = id as any;
    
    const presence = usePresence(conversationId);
    const { startTyping, stopTyping } = useTyping(conversationId);
    const [text, setText] = useState("");

    // Show typing indicator
    const typingUsers = presence?.filter(p => p.status === "typing") || [];

    const handleTextChange = (newText: string) => {
        setText(newText);
        if (newText.length > 0) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    // ... rest of component
}
```

## Verification Checklist
- [ ] Presence table added to schema
- [ ] Presence functions created and working
- [ ] Scheduled cleanup task configured
- [ ] Presence hooks implemented
- [ ] Chat screen shows online/typing indicators
- [ ] Presence updates in real-time
- [ ] Stale presence records cleaned up

## Notes

### Performance Considerations
- Presence updates frequently, so use indexes efficiently
- Clean up stale records to prevent table bloat
- Consider using Convex subscriptions for real-time updates

### User Experience
- Show "typing..." indicator when other users are typing
- Show online/offline status badges
- Debounce typing indicators to avoid spam

### Implementation Details
- Presence is ephemeral (temporary data)
- Last seen timestamp helps determine if user is truly offline
- Cleanup prevents presence table from growing indefinitely
- Use intervals or debouncing to limit mutation calls

## Optional Enhancements
- Add "last seen" timestamps
- Show read receipts for messages
- Add "away" status
- Custom status messages

