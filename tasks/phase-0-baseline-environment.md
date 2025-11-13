# Phase 0 — Baseline & Environment

## Overview
Set up the foundation for Convex + Better Auth integration by confirming the Convex project setup and configuring environment variables.

## Tasks

### 1. Confirm Convex Project Setup
- Verify existing Convex project exists in `apps/app/convex/`
- Check Convex version is ≥1.25.0 (required for Better Auth component)
- Upgrade if necessary: `pnpm add convex@latest` in `apps/app`

### 2. Start Convex Dev Server
- Run `pnpm dlx convex dev` in `apps/app` directory
- Keep this running during all implementation phases
- Verify connection and deployment initialization

### 3. Set Convex Environment Variables
Set these using `pnpm dlx convex env set`:

- **BETTER_AUTH_SECRET**: Generate a secure secret
  ```bash
  pnpm dlx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
  ```

- **SITE_URL**: Set to your Convex site URL
  ```bash
  pnpm dlx convex env set SITE_URL=https://<your-slug>.convex.site
  ```
  Note: Since we're mobile-only, this should be your Convex site URL, not a localhost URL.

### 4. Add Expo Environment Variables
Create or update `.env.local` in `apps/app/`:

```env
# Convex deployment URL
EXPO_PUBLIC_CONVEX_URL=https://<your-slug>.convex.cloud

# Convex site URL (for Better Auth endpoints)
EXPO_PUBLIC_CONVEX_SITE_URL=https://<your-slug>.convex.site

# Local site URL (if needed)
SITE_URL=http://localhost:8081
```

**Important**: 
- Use `EXPO_PUBLIC_` prefix for variables needed in the Expo app
- These will be available at build time
- Replace `<your-slug>` with your actual Convex deployment slug

## Verification Checklist
- [ ] Convex version ≥1.25.0 confirmed
- [ ] `convex dev` running successfully
- [ ] `BETTER_AUTH_SECRET` set in Convex environment
- [ ] `SITE_URL` set in Convex environment
- [ ] Expo environment variables added to `.env.local`
- [ ] Can see Convex dashboard/deployment is active

## Notes
- The Convex dev server will generate types automatically as you add schema and functions
- Keep `convex dev` running throughout all phases
- Environment variables set via `convex env set` are per-deployment (dev/prod)

