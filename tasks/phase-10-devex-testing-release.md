# Phase 10 — DevX, Testing, and Release

## Overview
Finalize the implementation with developer experience improvements, testing, documentation, and production deployment preparation.

## Tasks

### 1. Update Documentation
Update `apps/app/README.md`:

```markdown
# App Development Guide

## Prerequisites
- Node.js 18+
- pnpm
- Expo CLI
- Convex account

## Setup

### 1. Install Dependencies
\`\`\`bash
pnpm install
\`\`\`

### 2. Start Convex Dev Server
\`\`\`bash
cd apps/app
pnpm dlx convex dev
\`\`\`

Keep this running in a separate terminal.

### 3. Configure Environment Variables
Create \`.env.local\` in \`apps/app/\`:

\`\`\`env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
\`\`\`

### 4. Start Expo Dev Server
\`\`\`bash
cd apps/app
pnpm start
\`\`\`

## Development Workflow

1. Keep \`convex dev\` running to regenerate types
2. Make changes to Convex functions/schema
3. Types auto-update in \`convex/_generated/\`
4. Test in Expo app

## Project Structure

- \`convex/\` - Backend functions and schema
- \`app/\` - Expo Router screens
- \`src/lib/\` - Client utilities
- \`hooks/\` - React hooks

## Testing

Run tests:
\`\`\`bash
pnpm test
\`\`\`

## Deployment

See DEPLOYMENT.md for production deployment instructions.
```

### 2. Create Seed Script
Create `apps/app/convex/seed.ts`:

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Seed script for development
export const seedDatabase = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Only run in development
        if (process.env.CONVEX_DEPLOYMENT?.includes("prod")) {
            throw new Error("Cannot seed production database");
        }

        // Example: Create test users, posts, etc.
        // This would require creating Better Auth users first
        // For now, just a placeholder structure

        console.log("Database seeded successfully");
    },
});
```

Run seed:
```bash
pnpm dlx convex run seed:seedDatabase
```

### 3. Add TypeScript Types Package
Update `packages/types/index.ts`:

```typescript
// Shared types between packages
export type UserId = string;
export type PostId = string;
export type ConversationId = string;

// Add other shared types as needed
```

### 4. Create Test Utilities
Create `apps/app/convex/test-utils.ts`:

```typescript
// Utilities for testing Convex functions
export async function createTestUser(ctx: any, email: string) {
    // Helper to create test users for testing
    // Implementation depends on Better Auth test setup
}

export async function createTestPost(ctx: any, authorId: string, text: string) {
    return await ctx.db.insert("posts", {
        authorId,
        text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
}
```

### 5. Add Basic Unit Tests
Create `apps/app/convex/__tests__/posts.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ConvexTestingHelper } from "convex-test";

describe("posts", () => {
    it("should create a post", async () => {
        const t = new ConvexTestingHelper();
        // Set up test user and context
        // Call create mutation
        // Assert post was created
    });

    it("should not create post without auth", async () => {
        // Test authorization
    });
});
```

### 6. Add E2E Test Setup
Create `apps/app/__e2e__/auth.test.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("user can sign up and create post", async ({ page }) => {
    // Navigate to app
    // Sign up
    // Create post
    // Verify post appears
});
```

### 7. Create Deployment Guide
Create `apps/app/DEPLOYMENT.md`:

```markdown
# Deployment Guide

## Prerequisites
- Convex production deployment configured
- Expo EAS account (for app builds)
- Environment variables set in production

## Convex Deployment

1. Deploy Convex functions:
\`\`\`bash
pnpm dlx convex deploy --prod
\`\`\`

2. Set production environment variables:
\`\`\`bash
pnpm dlx convex env set BETTER_AUTH_SECRET=<prod-secret> --prod
pnpm dlx convex env set SITE_URL=<prod-site-url> --prod
\`\`\`

## Expo Deployment

1. Configure app.json with production Convex URLs

2. Build for production:
\`\`\`bash
eas build --platform ios
eas build --platform android
\`\`\`

3. Submit to stores:
\`\`\`bash
eas submit --platform ios
eas submit --platform android
\`\`\`

## Environment Variables

### Convex (Production)
- BETTER_AUTH_SECRET
- SITE_URL

### Expo (Build-time)
- EXPO_PUBLIC_CONVEX_URL
- EXPO_PUBLIC_CONVEX_SITE_URL

## Monitoring

- Set up Convex dashboard monitoring
- Configure error tracking (Sentry, etc.)
- Set up analytics
```

### 8. Add Development Scripts
Update `apps/app/package.json`:

```json
{
  "scripts": {
    "dev": "convex dev",
    "convex:dev": "pnpm dlx convex dev",
    "convex:deploy": "pnpm dlx convex deploy",
    "convex:types": "pnpm dlx convex codegen",
    "test": "vitest",
    "test:e2e": "playwright test",
    "seed": "pnpm dlx convex run seed:seedDatabase"
  }
}
```

### 9. Add Error Tracking Setup
Create `apps/app/lib/error-tracking.ts`:

```typescript
// Setup error tracking (Sentry, etc.)
export function initErrorTracking() {
    // Initialize error tracking service
    // Only in production
    if (process.env.NODE_ENV === "production") {
        // Sentry.init({ ... })
    }
}

export function captureError(error: Error, context?: Record<string, any>) {
    // Capture error to tracking service
    console.error("Error:", error, context);
}
```

### 10. Add Analytics Setup (Optional)
Create `apps/app/lib/analytics.ts`:

```typescript
// Analytics setup
export function trackEvent(event: string, properties?: Record<string, any>) {
    // Track event to analytics service
    // Example: PostHog, Mixpanel, etc.
}
```

## Verification Checklist
- [ ] README updated with setup instructions
- [ ] Seed script created (optional)
- [ ] TypeScript types package updated
- [ ] Test utilities created
- [ ] Unit tests added (at least basic structure)
- [ ] E2E test setup configured
- [ ] Deployment guide created
- [ ] Development scripts added to package.json
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)

## Documentation Checklist
- [ ] README with setup instructions
- [ ] API documentation (function descriptions)
- [ ] Deployment guide
- [ ] Environment variables documented
- [ ] Contributing guidelines (if open source)

## Testing Checklist
- [ ] Unit tests for core functions
- [ ] Integration tests for auth flow
- [ ] E2E tests for critical paths
- [ ] Test coverage report
- [ ] CI/CD pipeline configured

## Production Readiness Checklist
- [ ] Environment variables configured
- [ ] Error tracking set up
- [ ] Monitoring configured
- [ ] Backup strategy documented
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Load testing completed (if needed)

## Notes

### Testing Strategy
- Unit tests for Convex functions
- Integration tests for auth flows
- E2E tests for critical user journeys
- Manual testing checklist for releases

### Documentation
- Keep docs up to date with code changes
- Include examples in documentation
- Document all environment variables
- Include troubleshooting section

### CI/CD
- Set up GitHub Actions or similar
- Run tests on PR
- Deploy to staging automatically
- Manual approval for production

### Monitoring
- Set up Convex dashboard alerts
- Monitor error rates
- Track performance metrics
- Set up uptime monitoring

## Next Steps After Release
- Monitor error rates and performance
- Gather user feedback
- Iterate on features
- Plan next phase of development

