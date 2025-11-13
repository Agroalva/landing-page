# Phase 9 — Hardening

## Overview
Add input validation, comprehensive authorization checks, and rate limiting to secure the application and prevent abuse.

## Tasks

### 1. Enhanced Input Validation
Create `apps/app/convex/validators.ts`:

```typescript
import { v } from "convex/values";

// Reusable validators
export const emailValidator = v.string();
export const passwordValidator = v.string();
export const displayNameValidator = v.string();
export const postTextValidator = v.string();

// Custom validation helpers
export function validatePostText(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        throw new Error("Post text cannot be empty");
    }
    if (trimmed.length > 5000) {
        throw new Error("Post text is too long (max 5000 characters)");
    }
    return trimmed;
}

export function validateDisplayName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        throw new Error("Display name cannot be empty");
    }
    if (trimmed.length > 50) {
        throw new Error("Display name is too long (max 50 characters)");
    }
    return trimmed;
}
```

### 2. Add Rate Limiting
Create `apps/app/convex/rateLimit.ts`:

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

// Simple rate limiting using Convex tables
// Create a rateLimits table in schema
// rateLimits: defineTable({
//     userId: v.string(),
//     action: v.string(),
//     count: v.number(),
//     windowStart: v.number(),
// })

export async function checkRateLimit(
    ctx: any,
    userId: string,
    action: string,
    maxRequests: number,
    windowMs: number
): Promise<void> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit record
    let rateLimit = await ctx.db
        .query("rateLimits")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("action"), action))
        .first();

    if (!rateLimit) {
        // Create new record
        await ctx.db.insert("rateLimits", {
            userId,
            action,
            count: 1,
            windowStart: now,
        });
        return;
    }

    // Reset if window expired
    if (rateLimit.windowStart < windowStart) {
        await ctx.db.patch(rateLimit._id, {
            count: 1,
            windowStart: now,
        });
        return;
    }

    // Check limit
    if (rateLimit.count >= maxRequests) {
        throw new Error(`Rate limit exceeded for ${action}. Please try again later.`);
    }

    // Increment count
    await ctx.db.patch(rateLimit._id, {
        count: rateLimit.count + 1,
    });
}
```

### 3. Update Functions with Rate Limiting
Update `apps/app/convex/posts.ts`:

```typescript
import { checkRateLimit } from "./rateLimit";
import { validatePostText } from "./validators";

export const create = mutation({
    args: {
        text: v.string(),
        mediaIds: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Rate limiting: max 10 posts per minute
        await checkRateLimit(ctx, user.id, "createPost", 10, 60 * 1000);

        // Validate input
        const validatedText = validatePostText(args.text);

        // Validate media count
        if (args.mediaIds && args.mediaIds.length > 10) {
            throw new Error("Maximum 10 media files per post");
        }

        return await ctx.db.insert("posts", {
            authorId: user.id,
            text: validatedText,
            mediaIds: args.mediaIds || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});
```

### 4. Enhanced Authorization Checks
Update `apps/app/convex/posts.ts` delete function:

```typescript
export const deletePost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const post = await ctx.db.get(args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        // Strict ownership check
        if (post.authorId !== user.id) {
            throw new Error("Not authorized to delete this post");
        }

        // Optional: Check if post is too old to delete
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (post.createdAt < oneDayAgo) {
            throw new Error("Posts older than 24 hours cannot be deleted");
        }

        await ctx.db.delete(args.postId);
    },
});
```

### 5. Add Input Sanitization
Create `apps/app/convex/sanitize.ts`:

```typescript
// Basic sanitization helpers
export function sanitizeText(text: string): string {
    // Remove potentially dangerous characters
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .trim();
}

export function sanitizeDisplayName(name: string): string {
    // Allow alphanumeric, spaces, and basic punctuation
    return name.replace(/[^a-zA-Z0-9\s\-_\.]/g, "").trim();
}
```

### 6. Add Comprehensive Error Handling
Update functions to use consistent error handling:

```typescript
export const create = mutation({
    args: {
        text: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const user = await authComponent.getAuthUser(ctx);
            if (!user) {
                throw new Error("Not authenticated");
            }

            // ... validation and creation logic
        } catch (error) {
            // Log error for debugging (in production, use proper logging)
            console.error("Error creating post:", error);
            
            // Re-throw with user-friendly message
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Failed to create post. Please try again.");
        }
    },
});
```

### 7. Add Schema Validation
Update schema with constraints where possible:

```typescript
profiles: defineTable({
    userId: v.string(),
    displayName: v.string(), // Add length constraint in validation
    // ...
})
```

### 8. Add Security Headers (if using HTTP routes)
Update `apps/app/convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";

const http = httpRouter();

// Add CORS and security headers if needed
http.route({
    path: "/api/*",
    method: "GET",
    handler: async (request) => {
        // Add security headers
        return new Response(JSON.stringify({}), {
            headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff",
            },
        });
    },
});

// ... rest of routes
```

## Verification Checklist
- [ ] Input validation added to all mutations
- [ ] Rate limiting implemented for write operations
- [ ] Authorization checks on all sensitive operations
- [ ] Input sanitization applied where needed
- [ ] Error messages are user-friendly
- [ ] No sensitive information leaked in errors
- [ ] File upload size limits enforced
- [ ] Text length limits enforced

## Security Checklist

### Authentication
- [ ] All mutations require authentication
- [ ] Session validation on every request
- [ ] Proper session expiration handling

### Authorization
- [ ] Users can only modify their own data
- [ ] Ownership checks before delete/update
- [ ] Membership checks for conversations
- [ ] No privilege escalation possible

### Input Validation
- [ ] All inputs validated with `convex/values`
- [ ] Custom validation for business rules
- [ ] Length limits enforced
- [ ] Type checking on all inputs

### Rate Limiting
- [ ] Create post rate limited
- [ ] Send message rate limited
- [ ] Sign up rate limited (prevent spam)
- [ ] File upload rate limited

### Data Protection
- [ ] No sensitive data in error messages
- [ ] Proper error logging (without user data)
- [ ] File type validation
- [ ] File size limits

## Notes

### Rate Limiting Strategy
- Use sliding window or fixed window
- Consider using external service for distributed rate limiting
- Adjust limits based on user behavior

### Error Handling
- Never expose internal errors to users
- Log errors for debugging
- Provide helpful but generic error messages
- Consider error tracking service (Sentry, etc.)

### Performance
- Rate limiting adds database queries
- Consider caching for high-traffic endpoints
- Monitor performance impact

## Production Considerations
- Set up proper logging/monitoring
- Configure error tracking
- Set up alerts for suspicious activity
- Regular security audits
- Keep dependencies updated

