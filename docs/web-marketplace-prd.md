# Agroalva Web Marketplace PRD

**Status:** Draft  
**Version:** 1.0  
**Date:** July 14, 2026  
**Product:** Agroalva Web Marketplace  
**Owners:** Product and Engineering  
**Primary market:** Argentina  

## 1. Summary

Agroalva will expand its existing website from a marketing and product-sharing surface into a full web marketplace. Users will be able to discover listings, search and filter the catalog, view sellers, create and manage listings, save favorites, and communicate with other users from a desktop or mobile browser.

The web marketplace and the existing Expo mobile application will be two clients of the same product. They will use the same Convex deployment, Better Auth user accounts, database records, file storage, authorization rules, taxonomy, and real-time events. A listing created on the web must appear in the mobile app, and an action performed in the mobile app must be reflected on the web without data migration or synchronization jobs.

The initial release will prioritize a complete, trustworthy marketplace journey over exact visual parity with mobile. Public discovery and product pages will be optimized for search engines and sharing, while authenticated interactions will use Convex's real-time client capabilities.

## 2. Problem statement

Agroalva's marketplace is currently centered on the mobile application. The website primarily explains the product, collects newsletter registrations, supports password reset, and renders limited shared-product pages. This creates several limitations:

- Prospective users cannot fully explore the marketplace before installing the app.
- Desktop users cannot efficiently browse, compare, publish, or manage agricultural listings.
- Public listings have limited search-engine visibility and acquisition potential.
- Shared links lead to an app-oriented preview instead of a complete web marketplace journey.
- Sellers and service providers cannot manage their activity from a larger-screen workflow.

## 3. Product vision

Agroalva should feel like one marketplace regardless of the device used. The web experience should make the public catalog easy to discover and give authenticated users the core capabilities required to participate in the marketplace, while preserving the mobile app as a first-class client.

## 4. Goals

### 4.1 Product goals

1. Allow guests to browse useful marketplace content without creating an account.
2. Allow users to use the same account and profile on web and mobile.
3. Allow authenticated web users to create, edit, and manage marketplace listings.
4. Allow authenticated web users to favorite listings and contact other users through Agroalva messaging.
5. Make public listings and seller profiles indexable, shareable, and useful outside the app.
6. Maintain real-time consistency across web and mobile through one shared backend.
7. Preserve compatibility with released mobile clients throughout development and launch.

### 4.2 Business goals

- Increase qualified marketplace traffic through search, social sharing, and direct links.
- Increase the number of listing views, seller contacts, and completed listing submissions.
- Reduce installation friction for users who want to evaluate Agroalva first.
- Improve retention by letting users continue their activity across desktop and mobile.

## 5. Non-goals

The following are outside the initial web marketplace release unless separately approved:

- Processing payments, deposits, financing, or escrow inside Agroalva.
- Shipping, logistics, or fulfillment management.
- Ratings and reviews.
- Paid listing promotion or seller subscriptions.
- Advanced geospatial or radius-based search.
- Browser push notifications.
- Audio, video, or image attachments in chat.
- Replacing the mobile application or maintaining a separate web database.
- Redesigning or breaking existing mobile flows solely to match the web UI.

## 6. Target users

### 6.1 Producer or buyer

Needs to search for machinery, inputs, agricultural products, services, or rental opportunities; compare listings; save relevant items; and contact sellers.

### 6.2 Seller or distributor

Needs to publish items, maintain listing information and photos, respond to interested users, and manage active inventory from desktop or mobile.

### 6.3 Service provider

Needs to advertise agricultural services, present a trustworthy profile, receive inquiries, and keep listing information current.

### 6.4 Marketplace administrator

Needs to manage existing marketplace content and operational surfaces. Broader moderation tooling is a later scope item; the existing banner administration page remains supported.

## 7. Product principles

1. **One marketplace, two clients:** Web and mobile expose the same underlying users, profiles, listings, favorites, conversations, and notifications.
2. **Public discovery, protected actions:** Guests can browse; account-specific actions require authentication.
3. **Additive backend evolution:** Existing fields and public Convex functions cannot be removed, renamed, or reinterpreted.
4. **Spanish-first experience:** User-facing copy must use clear Argentine Spanish and consistent Agroalva terminology.
5. **Trust before conversion:** Seller identity, listing freshness, clear locations, safety guidance, and predictable contact flows are more important than decorative complexity.
6. **Progressive enhancement:** Public pages remain useful without requiring client-side account state; real-time features enhance authenticated workflows.

## 8. Scope and information architecture

### 8.1 Public routes

| Route | Purpose |
|---|---|
| `/` | Updated Agroalva home with marketplace entry points, featured categories, and app download links |
| `/marketplace` | Browse, search, filter, and paginate active listings |
| `/product/[id]` | Canonical product detail page; retains compatibility with existing shared links |
| `/profile/[userId]` | Public seller or service-provider profile and active listings |
| `/sign-in` | Sign in with an existing Agroalva account |
| `/sign-up` | Create an Agroalva account and profile |
| `/forgot-password` | Request a password reset |
| `/reset-password` | Complete the existing password reset flow |
| `/help` | Marketplace help, contact information, and safety guidance |
| `/terms` | Terms and conditions |
| `/privacy` | Privacy policy |

### 8.2 Authenticated routes

| Route | Purpose |
|---|---|
| `/publish` | Create a listing |
| `/product/[id]/edit` | Edit an owned listing |
| `/my-listings` | View and manage the current user's listings |
| `/favorites` | View saved listings |
| `/messages` | View conversations and unread state |
| `/messages/[id]` | Real-time text conversation |
| `/notifications` | View and mark notifications as read |
| `/account/profile` | Edit display name, biography, avatar, and contact details |

Route names may be adjusted before implementation, except `/product/[id]`, which must remain a stable canonical URL for backward compatibility.

## 9. Functional requirements

### 9.1 Global marketplace shell

**WEB-001 — Navigation**  
The web marketplace must provide responsive navigation with access to the marketplace, search, publishing, favorites, messages, notifications, profile, sign-in, and sign-out as appropriate for the user's session.

**WEB-002 — Responsive layout**  
All core flows must work at mobile-browser, tablet, laptop, and wide-desktop widths. Desktop layouts should take advantage of additional space without hiding functionality from smaller screens.

**WEB-003 — Session continuity**  
The web client must use Better Auth and the same user identity stored by the existing backend. Signing in on the web must expose the same profile and marketplace data associated with that account in the mobile app.

### 9.2 Marketplace discovery

**WEB-010 — Guest browsing**  
Guests must be able to browse active listings and open product and public profile pages without signing in.

**WEB-011 — Listing cards**  
Each marketplace card must display at least the primary image, listing name, sale or rental type, price when available, category, location label when available, and seller display name.

**WEB-012 — Filtering**  
Users must be able to filter by taxonomy family, category, and listing type (`sell` or `rent`). Filters must be encoded in the URL so results can be refreshed, bookmarked, and shared.

**WEB-013 — Search**  
Users must be able to search listing names and descriptions. Search must support real pagination and must not rely on scanning a fixed number of recent records in application memory.

**WEB-014 — Pagination**  
Browsing and search results must support cursor-based pagination or infinite loading with recoverable URL state. Loading more results must not duplicate or skip listings.

**WEB-015 — Empty, loading, and error states**  
Marketplace views must provide Spanish loading states, actionable empty states, retry behavior, and clear error messages.

### 9.3 Product details

**WEB-020 — Canonical product page**  
`/product/[id]` must become the complete web product experience while keeping existing shared URLs valid.

**WEB-021 — Product information**  
The page must display the image gallery, name, description, listing type, price and currency, taxonomy, applicable attributes, location label, publication date, seller information, and availability state.

**WEB-022 — Product actions**  
Users must be able to share a listing. Authenticated users must be able to favorite it and contact the seller. Guests choosing a protected action must be directed to sign in and returned to the originating listing afterward.

**WEB-023 — Ownership actions**  
Listing owners must see edit and delete actions instead of seller-contact actions. Deletion requires explicit confirmation.

**WEB-024 — Unavailable products**  
Missing or deleted listing pages must explain that the listing is unavailable, must not expose private data, and must provide a path back to marketplace results.

**WEB-025 — View tracking**  
A valid product visit may increment the existing view count. The implementation must avoid obvious duplicate increments caused by React rendering or metadata generation.

### 9.4 Authentication and profiles

**WEB-030 — Authentication flows**  
The web must support email/password sign-up, sign-in, sign-out, password-reset request, and password-reset completion through the existing Better Auth integration.

**WEB-031 — Profile creation**  
New accounts must receive a Convex profile using the existing profile-creation behavior. Legacy accounts without a profile must be handled gracefully.

**WEB-032 — Profile management**  
Authenticated users must be able to update display name, biography, phone number, and avatar. Changes must appear in the mobile app without synchronization logic.

**WEB-033 — Public profiles**  
Public profiles must display public identity fields and active listings. Phone numbers, push tokens, roles, and other private fields must never be exposed to unauthenticated users.

### 9.5 Listing management

**WEB-040 — Create listing**  
Authenticated users must be able to create a sale or rental listing using the shared taxonomy and the same backend mutation used by mobile, or a backward-compatible additive successor.

**WEB-041 — Required listing data**  
Creation must support name, description, sale/rental type, family, category, category-specific attributes, optional price and currency, location, and one to five images. At least one image is required.

**WEB-042 — Image upload**  
Images must upload to the same Convex storage used by mobile. The UI must validate supported formats and limits, show previews and progress, allow removal before submission, and prevent orphaned uploads where practical.

**WEB-043 — Edit listing**  
Owners must be able to edit existing listing fields and images. Authorization must be enforced in Convex rather than only in the browser.

**WEB-044 — Delete listing**  
Owners must be able to delete their listing after confirmation. Existing cleanup behavior for related records and media must be reviewed and defined before launch.

**WEB-045 — My listings**  
Authenticated users must be able to view their listings, open them, edit them, and delete them from a dedicated management screen.

### 9.6 Favorites

**WEB-050 — Favorite state**  
Authenticated users must be able to add and remove favorites from listing cards and product pages. The state must update consistently across all open web surfaces and the mobile app.

**WEB-051 — Favorites collection**  
The favorites page must display current listing data and gracefully remove or mark unavailable products.

### 9.7 Messaging

**WEB-060 — Start conversation**  
Authenticated users must be able to start or resume a conversation with a seller from a listing or public profile. A user cannot start a conversation with themselves.

**WEB-061 — Conversation list**  
The conversation list must display the other participant, last-message preview, last-message time, and unread count, ordered by recent activity.

**WEB-062 — Real-time chat**  
Conversation pages must display real-time text messages, timestamps, sender identity, and read state using the shared Convex conversation and message records.

**WEB-063 — Text-only messaging**  
The initial web release supports text messages only, consistent with the current mobile product direction.

**WEB-064 — Messaging authorization**  
Convex must verify conversation membership for all reads and writes. Private messages must never be server-rendered into public or cacheable output.

### 9.8 Notifications

**WEB-070 — Notification center**  
Authenticated users must be able to view their existing Agroalva notifications and mark individual or all notifications as read.

**WEB-071 — Unread indicators**  
The global shell must display real-time unread message and notification counts when available.

**WEB-072 — Notification navigation**  
Selecting a notification must route to the relevant listing or conversation when the related record exists, and fail gracefully when it does not.

### 9.9 Marketing and app interoperability

**WEB-080 — Updated launch messaging**  
The homepage must no longer present Agroalva as an unreleased waitlist product. It must direct users to the web marketplace and the live mobile store listings.

**WEB-081 — Deep links**  
Existing app links and universal-link association endpoints must remain functional. Product URLs must open the web product page when the app is unavailable.

**WEB-082 — Cross-platform sharing**  
Web and mobile must generate the same canonical product URL format.

## 10. Backend and technical requirements

### 10.1 Shared backend

- Web and mobile must connect to the same Convex deployment per environment.
- Better Auth remains the identity provider for both clients.
- Convex remains the source of truth for profiles, products, favorites, conversations, messages, notifications, banners, and file storage.
- No duplicate REST database or web-only persistence layer may be introduced.
- Environment separation must be explicit for local development, preview, staging if added, and production.

### 10.2 Shared client contract

The generated Convex API and data-model types should be exposed through an explicit workspace package such as `@repo/backend`. The web app must not depend permanently on brittle relative imports through `apps/app`.

The initial migration may keep the Convex deployment source in its current directory while the workspace package provides a stable client-facing facade. Relocating the deployment source is optional and must not change deployed function names.

Shared taxonomy definitions and marketplace field types must also be imported from one source rather than copied between clients.

### 10.3 Additive API evolution

New web requirements should be supported through additive functions and optional fields when changing an existing contract could affect released mobile clients. Specifically:

- Do not remove or rename existing Convex functions.
- Do not change the type or meaning of existing fields.
- Add validators for all new function arguments and return values.
- Return `null` for expected not-found cases and throw for authorization or unexpected failures.
- Prefer indexed queries over in-memory filtering and full-table collection.
- Keep private operations internal and enforce authorization server-side.

### 10.4 Marketplace read models

The backend should provide purpose-built, validated read models for web marketplace cards and details. A listing-card result should include resolved image URLs, public seller summary, taxonomy data, and counts needed by the view. This prevents the browser from issuing a separate query for every image or seller.

New read models must omit private profile data by construction.

### 10.5 Search

The current search behavior must be replaced or supplemented with a production-safe indexed search function that:

- Searches the complete eligible catalog rather than only the most recent fixed-size sample.
- Supports family, category, and listing-type filters.
- Uses a real continuation cursor.
- Applies explicit maximum page sizes.
- Returns validated public result objects.
- Remains backward compatible with the existing mobile search contract.

### 10.6 Rendering model

- Public marketplace, product, and profile pages should be server-rendered where it improves SEO and link previews.
- Session-dependent controls and real-time data should be isolated in client components.
- Authenticated pages must not be publicly cached.
- Metadata generation and page rendering should share read logic without causing duplicate view-count mutations.
- Product and profile pages must define canonical metadata and appropriate unavailable-state indexing rules.

## 11. Privacy, security, and trust

- All mutation authorization must be enforced in Convex.
- Public queries must return explicit public DTOs and never entire internal profile records.
- Contact details should only be visible according to the approved contact policy.
- Password and session handling must remain inside Better Auth.
- File uploads must validate MIME type, size, ownership expectations, and permitted count.
- User-generated content must be rendered safely and must not execute HTML or scripts.
- Rate limiting or equivalent abuse controls are required for sign-in attempts, listing creation, view counting, search, and messaging before general launch.
- Terms, privacy, content-reporting guidance, and safe-trading guidance must be accessible from marketplace pages.
- Administrator roles must be verified server-side for every admin operation.

## 12. Accessibility and localization

- Target WCAG 2.2 AA for core marketplace flows.
- All functionality must be keyboard accessible.
- Forms must have programmatic labels, field-level errors, and useful focus management.
- Images require meaningful alternative text or must be marked decorative.
- Color cannot be the only indicator of status or validation.
- Loading and real-time updates must be understandable to assistive technology without excessive announcements.
- UI copy, validation, dates, prices, and currency presentation must be appropriate for Argentine Spanish (`es-AR`).
- Internal code and identifiers may remain in English.

## 13. Performance and reliability

### 13.1 Performance targets

For the 75th percentile of production traffic on supported devices:

- Largest Contentful Paint: at or below 2.5 seconds.
- Interaction to Next Paint: at or below 200 milliseconds.
- Cumulative Layout Shift: at or below 0.1.
- Marketplace result pages must avoid unbounded query fan-out.
- Images must be responsively sized, compressed where appropriate, and lazy-loaded below the fold.

### 13.2 Reliability requirements

- Core reads must provide retryable error states.
- Listing form drafts should not be lost because of a recoverable image-upload or mutation error.
- Reconnect behavior must recover real-time lists and chat after temporary network loss.
- Web errors must not alter or corrupt mobile-visible data.
- Production must include client-error monitoring and backend error visibility.

## 14. Analytics and success metrics

### 14.1 Primary success metric

**Qualified marketplace contacts from web:** the number and rate of web sessions in which a user starts or resumes a seller conversation from a listing.

### 14.2 Supporting metrics

- Unique marketplace visitors.
- Marketplace-to-product-detail click-through rate.
- Search usage and search-to-detail click-through rate.
- Zero-result search rate.
- Sign-up and sign-in completion rates.
- Favorite rate per product detail view.
- Listing creation start and completion rates.
- Listing creation error and abandonment rates.
- Number of active listings created or edited on web.
- Conversation starts and messages sent on web.
- Share-link visits and subsequent marketplace actions.
- Cross-platform users active on both web and mobile.
- Core Web Vitals pass rate.

### 14.3 Required analytics events

At minimum:

- `marketplace_viewed`
- `marketplace_filter_changed`
- `marketplace_search_submitted`
- `marketplace_search_zero_results`
- `product_viewed`
- `product_shared`
- `favorite_toggled`
- `auth_started`
- `auth_completed`
- `listing_creation_started`
- `listing_created`
- `listing_updated`
- `seller_contact_started`
- `conversation_started`
- `message_sent`

Events must avoid raw message text, phone numbers, email addresses, or other unnecessary personal information.

## 15. Delivery plan

### Phase 0 — Shared foundation

- Establish the shared Convex API/type/taxonomy facade.
- Verify production, preview, and local environment configuration.
- Complete web authentication routes and protected-route behavior.
- Build the responsive marketplace shell and reusable listing components.
- Define public and authenticated backend read models.
- Add an initial automated-test setup for critical shared behavior.

**Exit criteria:** A web session can authenticate against the production-shaped shared backend, load the current user's profile, and safely render a marketplace shell without affecting mobile behavior.

### Phase 1 — Public marketplace

- Marketplace feed with real pagination.
- Family, category, and listing-type filters in URL state.
- Scalable indexed search.
- Complete product detail pages.
- Public seller profiles.
- Updated homepage, SEO metadata, structured data, sitemap, and sharing.

**Exit criteria:** A guest can find a listing through browse or search, inspect its seller, share the canonical URL, and reach an authentication gate when attempting a protected action.

### Phase 2 — Accounts and listing management

- Sign-up, sign-in, password reset, and profile editing.
- Listing creation with taxonomy attributes, location, and images.
- Listing editing and deletion.
- My listings and favorites.

**Exit criteria:** An authenticated user can create a valid listing on web, see it in the mobile app, edit it from either client, and observe the same final state on both.

### Phase 3 — Messaging and notifications

- Contact-seller entry points.
- Conversation list and real-time text chat.
- Read state and unread counts.
- Notification center and related navigation.

**Exit criteria:** A web user and mobile user can exchange messages in the same conversation with consistent ordering, authorization, unread state, and notifications.

### Phase 4 — Hardening and launch

- Accessibility review and remediation.
- Performance testing and query optimization.
- Security and authorization review.
- Rate limiting and abuse controls.
- End-to-end tests for critical journeys.
- Analytics dashboards and error monitoring.
- Cross-browser and responsive QA.
- Operational runbook and rollback plan.

**Exit criteria:** All launch gates in Section 17 pass, with no known critical security, data-compatibility, or core-journey defects.

## 16. Testing strategy

### 16.1 Automated coverage

- Unit tests for shared formatting, taxonomy mapping, validation, and URL-state utilities.
- Convex tests for authorization, public/private DTO boundaries, pagination, search filters, and backward-compatible behavior.
- Component tests for forms, filters, cards, and authentication gates.
- End-to-end tests for guest discovery, sign-up/sign-in, listing creation, favorites, and messaging.
- Compatibility tests covering existing mobile contracts when backend functions change.

### 16.2 Required end-to-end journeys

1. Guest browses, filters, searches, and opens a listing.
2. Guest attempts to favorite or contact, signs in, and returns to the original listing.
3. User creates a listing with images on web and sees it on mobile.
4. User edits a mobile-created listing on web.
5. User favorites on web and sees the favorite on mobile.
6. Web and mobile users exchange messages in real time.
7. Listing owner deletes a listing and existing shared links show the unavailable state.
8. Unauthorized users cannot edit listings or read conversations they do not own.

## 17. Launch gates

The web marketplace is ready for general availability when:

- No existing mobile endpoint or stored field has been removed or incompatibly changed.
- Guest browse, search, filters, product pages, and profiles meet acceptance criteria.
- Authentication, listing management, favorites, and messaging pass end-to-end testing.
- Cross-client data changes are verified in both directions.
- Authorization tests cover products, profiles, favorites, conversations, notifications, files, and admin functions.
- No private contact, session, or message data appears in public responses or page output.
- Core marketplace flows meet WCAG 2.2 AA requirements with no known critical violations.
- Production Core Web Vitals are measurable and no known implementation issue prevents meeting the stated targets.
- Analytics and error monitoring are active.
- Terms, privacy, help, safety, and support links are available.
- A rollback plan exists for web deployment and additive backend changes.

## 18. Dependencies

- Stable production Convex deployment and environment configuration.
- Better Auth trusted origins and web callback behavior.
- Existing Agroalva taxonomy and category attributes.
- Convex storage upload and delivery behavior.
- Product and profile public-data policy.
- Design direction for desktop marketplace components.
- Final legal text and marketplace safety guidance.
- Analytics and error-monitoring provider decisions.

## 19. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Backend changes break released mobile clients | Critical | Add new functions/optional fields, preserve old contracts, and run compatibility journeys before deployment |
| Search or listing cards cause expensive query fan-out | High | Add indexed, paginated marketplace read models with hydrated public data |
| Private profile or message data is exposed through public rendering | Critical | Use explicit public validators/DTOs and authorization tests; never serialize internal records directly |
| Web and mobile taxonomy drift | High | Import taxonomy and field types from a shared workspace source |
| Image uploads leave unused storage objects | Medium | Track upload ownership and clean abandoned or replaced files through defined backend behavior |
| SEO rendering conflicts with real-time authenticated UI | Medium | Keep public server-rendered content separate from session-aware client components |
| Marketplace scope delays launch | High | Deliver phases independently, beginning with guest discovery and product pages |
| Spam, scraping, or abusive messaging increases | High | Add rate limits, reporting paths, monitoring, and server-side authorization before general launch |

## 20. Open decisions

These decisions should be resolved during Phase 0 but do not prevent initial technical foundation work:

1. Should phone and WhatsApp contact information be revealed after sign-in, or should all first contact occur through Agroalva messaging?
2. Are all valid listings immediately public, or is moderation/approval required?
3. What constitutes an active or expired listing, and should expiration be introduced as an additive field?
4. Should search initially cover products only, or products and public profiles in one result view?
5. Which listing sorting options are required beyond newest first?
6. Is location filtering needed for the first launch, or is location display sufficient?
7. Should users be able to save incomplete listing drafts?
8. Which analytics and error-monitoring providers will be used?
9. Are `/marketplace` and English resource paths acceptable, or should new public routes use Spanish slugs?
10. What reporting and moderation workflow is required before public launch?

## 21. Recommended defaults for unresolved decisions

Unless product leadership selects another direction:

- Require authentication and use Agroalva messaging for first contact; reveal phone details only under the existing authenticated profile policy.
- Publish valid listings immediately and add reporting/moderation as an operational safeguard.
- Launch with newest-first sorting and location display, then add advanced sorting and geographic filtering based on usage.
- Search products first and expose seller profiles through product pages; add combined profile search later.
- Keep `/product/[id]` unchanged and use concise English resource paths consistently with the existing codebase, while keeping all visible copy in Spanish.
- Do not require drafts for the first release, but preserve entered form state through recoverable upload or submission errors.

