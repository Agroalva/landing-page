# Phase 4 — Data Model (Convex)

## Overview
Define the Convex database schema for user profiles, posts, conversations, messages, and any other entities needed by the app.

## Tasks

### 1. Create Schema File
Create `apps/app/convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Better Auth will create internal tables automatically
    // We only define app-specific tables here

    profiles: defineTable({
        userId: v.string(), // References Better Auth user ID
        displayName: v.string(),
        avatarId: v.optional(v.id("_storage")), // Reference to Convex file storage
        bio: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_displayName", ["displayName"]),

    posts: defineTable({
        authorId: v.string(), // References Better Auth user ID
        text: v.string(),
        mediaIds: v.optional(v.array(v.id("_storage"))), // Array of file storage IDs
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_authorId", ["authorId"])
        .index("by_createdAt", ["createdAt"]),

    conversations: defineTable({
        memberIds: v.array(v.string()), // Array of Better Auth user IDs
        lastMessageAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_memberIds", ["memberIds"])
        .index("by_lastMessageAt", ["lastMessageAt"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.string(), // References Better Auth user ID
        text: v.string(),
        mediaId: v.optional(v.id("_storage")),
        createdAt: v.number(),
    })
        .index("by_conversationId", ["conversationId"])
        .index("by_conversationId_createdAt", ["conversationId", "createdAt"]),

    // Optional: If you have a product feature
    products: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        imageId: v.optional(v.id("_storage")),
        createdAt: v.number(),
    })
        .index("by_createdAt", ["createdAt"]),
});
```

### 2. Verify Schema
- Save the file and check that `convex dev` picks it up
- Verify no TypeScript errors
- Check that types regenerate in `convex/_generated/dataModel.d.ts`

### 3. Update Convex Config (if needed)
Ensure your `convex.config.ts` doesn't conflict with the schema. The Better Auth component should work alongside your custom schema.

## Verification Checklist
- [ ] `schema.ts` created with all tables
- [ ] Indexes defined for common query patterns
- [ ] Types regenerated successfully (`convex dev` running)
- [ ] No TypeScript errors in schema file
- [ ] `dataModel.d.ts` updated with new types

## Schema Design Notes

### User Identity
- Better Auth creates its own user tables internally
- Use `userId` (string) to reference Better Auth users in your tables
- Don't create a duplicate `users` table

### Indexes
- **profiles.by_userId**: Fast lookup of profile by user ID
- **posts.by_authorId**: Get all posts by a user
- **posts.by_createdAt**: Get posts in chronological order
- **conversations.by_memberIds**: Find conversations for specific users
- **messages.by_conversationId_createdAt**: Get messages in order

### File Storage
- Use `v.id("_storage")` for Convex file storage references
- Store arrays of IDs for multiple media files
- Files are stored separately from database records

### Timestamps
- Use `v.number()` for Unix timestamps (milliseconds)
- Set `createdAt` on creation, `updatedAt` on updates

## Next Steps
After this phase, you can:
- Reference these tables in Convex functions
- Use type-safe queries and mutations
- Add validation rules in function handlers

