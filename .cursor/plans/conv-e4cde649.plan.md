<!-- e4cde649-986d-4f48-a5c7-a5720ed6f0ec 874b4c5d-c34f-46a3-94be-ab151db41575 -->
# Convex + Better Auth plan (Expo app only)

## Scope

- **Targets**: `apps/app` (Expo Router). No web/Next.js integration right now.
- **Auth**: Better Auth with Convex component, starting with email + password.
- **Avoid**: Next.js proxy routes (not needed for mobile-only); we’ll hit Convex-hosted auth endpoints directly.

## Phase 0 — Baseline & environment

- Confirm existing Convex project in `apps/app/convex/` and upgrade to Convex ≥1.25.
- Keep `pnpm dlx convex dev` running in `apps/app` during implementation.
- Set Convex env vars:
- `BETTER_AUTH_SECRET`
- `SITE_URL` → set to your Convex site URL (e.g., `https://<slug>.convex.site`) since we’re mobile-only.
- Add Expo env vars (app-side):
- `EXPO_PUBLIC_CONVEX_URL` (e.g., `https://<slug>.convex.cloud`)
- `EXPO_PUBLIC_CONVEX_SITE_URL` (e.g., `https://<slug>.convex.site`)

## Phase 1 — Better Auth in Convex

- Install: `better-auth@1.3.27`, `convex@latest`, `@convex-dev/better-auth` in `apps/app`.
- Add `apps/app/convex/convex.config.ts`:
- `defineApp()` + `app.use(betterAuth)`.
- Add `apps/app/convex/auth.config.ts` with provider domain `process.env.CONVEX_SITE_URL` or `SITE_URL` and `applicationID: "convex"`.
- Add `apps/app/convex/auth.ts`:
- Create `authComponent = createClient(components.betterAuth)`.
- `createAuth(ctx, { optionsOnly })` with `betterAuth({ baseURL: process.env.SITE_URL, database: authComponent.adapter(ctx), emailAndPassword: { enabled: true }, plugins: [convex()] })`.
- Optional helper `getCurrentUser` query.
- Add `apps/app/convex/http.ts`:
- `authComponent.registerRoutes(http, createAuth)`; export router.

## Phase 2 — Client provider and auth client (Expo)

- Create `apps/app/src/lib/auth-client.ts`:
- `createAuthClient({ plugins: [convexClient()] })`.
- Create `apps/app/app/ConvexClientProvider.tsx`:
- `ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, { expectAuth: true })`.
- Wrap children with `<ConvexBetterAuthProvider client={convex} authClient={authClient}>`.
- Wrap root layout `apps/app/app/_layout.tsx` with `ConvexClientProvider`.

## Phase 3 — Auth UI flows (Expo)

- Screens: add minimal `SignIn`, `SignUp`, `Account` components under `apps/app/app/(auth)/` or reuse existing navigation.
- Use `authClient` methods for `signIn.email`, `signUp.email`, `signOut`, `useSession`.
- Gate tabs/routes (e.g., `messages`, `create-post`) behind session presence.

## Phase 4 — Data model (Convex)

- Add `apps/app/convex/schema.ts` (Convex schema):
- `users_private` (Better Auth creates internal tables; keep app-specific `profiles`).
- `profiles` (userId, displayName, avatarId).
- `posts` (authorId, text, mediaId[], createdAt); indexes by `authorId`, `createdAt`.
- `conversations` (memberIds[], lastMessageAt), `messages` (conversationId, senderId, text, mediaId[], createdAt); indexes by convo/time.
- Optional: `products` if needed by `product/[id].tsx`.
- Regenerate types by keeping `convex dev` running.

## Phase 5 — Convex functions (secure)

- `apps/app/convex/users.ts`: `getMe`, `updateProfile`.
- `apps/app/convex/posts.ts`: `create`, `feed`, `byUser`, `delete` (ownership checks).
- `apps/app/convex/conversations.ts`: `ensureConversation(members)`, `listForUser`, `sendMessage`, `listMessages`.
- `apps/app/convex/search.ts`: simple search across `posts`/`profiles`.
- Each handler: fetch identity via Better Auth, validate args, enforce RLS/ownership.

## Phase 6 — Wire Expo screens to Convex

- `index.tsx` (feed): `useQuery(api.posts.feed)`.
- `create-post.tsx`: `useMutation(api.posts.create)` + media picker (Phase 8 if file storage).
- `messages.tsx` and `chat/[id].tsx`: list convos + live messages with `useQuery` (pagination as needed) and `useMutation(api.conversations.sendMessage)`.
- `profile.tsx`: load/update profile.
- `search.tsx`: bind to `api.search.query`.

## Phase 7 — Realtime presence (optional)

- Add `presence` table (ephemeral), mutations to set online/typing, and subscriptions from chat screen.

## Phase 8 — Media storage (optional but recommended)

- Use Convex file storage: upload images/videos, store `storageId` on `posts/messages/profiles`.
- Add upload helpers on Expo (chunked upload, progress UI).

## Phase 9 — Hardening

- Input validation with `convex/values` and shared Zod schemas in `packages/types` (optional).
- Authorization checks on every mutation/query.
- Rate limiting for auth-sensitive and write endpoints.

## Phase 10 — DevX, testing, and release

- Local dev docs in repo `README.md` (how to run Expo + Convex dev together).
- Add seed scripts (optional) using `convex tasks`.
- Basic unit tests for Convex functions with mocks; light E2E for auth and posting.
- Configure Convex project settings, promote to prod, document required secrets.

## Notes for Expo-only auth

- We skip the Next.js proxy route step entirely.
- `baseURL` in `convex/auth.ts` should be your Convex site URL so the Better Auth client hits Convex-hosted endpoints.
- On Expo, use `EXPO_PUBLIC_` env names; ensure they’re loaded at build time.

### To-dos

- [ ] Confirm Convex version, run convex dev, set Convex env vars
- [ ] Install convex, better-auth, convex-better-auth packages in apps/app
- [ ] Add convex.config.ts with betterAuth component
- [ ] Add convex/auth.config.ts with domain + applicationID
- [ ] Create convex/auth.ts with createAuth + helper query
- [ ] Register routes in convex/http.ts via authComponent.registerRoutes
- [ ] Create apps/app/src/lib/auth-client.ts with convexClient plugin
- [ ] Wrap Expo app with ConvexBetterAuthProvider in ConvexClientProvider
- [ ] Implement SignIn/SignUp screens and gating
- [ ] Create convex/schema.ts for profiles, posts, conversations, messages
- [ ] Implement users, posts, conversations, search Convex functions
- [ ] Connect existing screens to Convex queries/mutations
- [ ] Add presence typing/online realtime (optional)
- [ ] Implement file uploads via Convex storage (optional)
- [ ] Add validation, authorization checks, and rate limiting
- [ ] Update README, add seeds/tests, prepare deploy steps