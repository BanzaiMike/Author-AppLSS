Module Three – Introducing App


Intent

    Introduce /app.

    For now:
        App = "Fake App"

    This module establishes:

        - The primary authenticated destination
        - The application layout shell (look-and-feel + navigation frame)
        - The canonical Account surface as a normal in-app page
        - Migration of Stripe return URLs to the in-app account route

    This module restructures routing and presentation only.
    No subscription logic, entitlement logic, webhook logic,
    or deletion rules are altered.


Architectural Direction

    /app becomes the product home.

    /app/account becomes the canonical account and billing surface.

    Account is a normal page within the /app shell.
    There is no flyout, no route interception, no parallel routes.

    /account becomes a legacy alias that redirects to /app/account.

    Stripe must return users to /app/account.


Non-Breaking Constraints (Strict)

    1. No existing functional behavior may change.

        - Authentication guards must behave identically.
        - Server Actions must retain signatures and side effects.
        - Stripe webhook behavior must not change.
        - Entitlement logic must not change.
        - Deletion eligibility logic must not change.

    2. All existing routes must remain valid during migration.

            /
            /login
            /signup
            /account   (legacy alias)
            /confirm-delete-account
            /auth/callback
            /reset-password
            All /api/* routes

    3. Query parameter contracts must remain intact.

            ?message=checkout-success
            ?message=checkout-canceled
            ?delete=blocked

    4. No database schema changes.
    5. No Stripe API surface changes.
    6. No webhook changes.
    7. No new npm dependencies.


Step 1 — Create /app Shell (Required)

    Create:

        /app/app/layout.tsx
        /app/app/page.tsx

    Requirements:

        - /app must require authentication.
        - Unauthenticated users must redirect to /login.
        - Post-login redirect must go to /app (not /account, not /app/account).
        - Post-signup redirect must go to /app (not /account, not /app/account).
        - Existing confirmation/error flows must not be broken.

    /app/page.tsx content is placeholder only.

    Layout Structure (Required)

        - layout.tsx must render a navigation bar.
        - layout.tsx must render a content wrapper around {children}.
        - The content wrapper must be a <div>, not <main>.
          (Avoid nested <main> when child pages render their own <main>.)

        - layout.tsx must remain Server Component compatible.
        - layout.tsx must not convert entire layout into "use client".

    Nav Auth Policy (Required)

        - The layout must not call requireUser().
        - If user display is needed in nav:
              use getCurrentUser() for display only.
        - Authorization enforcement remains middleware + page-level requireUser().


Step 2 — Create Canonical Account Page at /app/account (Required)

    Create:

        /app/app/account/page.tsx

    Requirements:

        - Must render identical account UI and behavior as current /account.
        - Must preserve all searchParams behavior:
              ?message=checkout-success
              ?message=checkout-canceled
              ?delete=blocked
        - Must remain a Server Component.


Rendering Unification (Required)

    Goal:

        Exactly one implementation of account rendering and messaging,
        used by both:

            /account
            /app/account


Shared Component Location (Required)

    Extract current /account UI into a shared Server Component in a neutral location:

        /app/_components/account-ui.tsx


Auth Guard Location (Required)

    - The shared account component must call requireUser() internally.
    - Page routes render the shared component and pass only searchParams-derived props.
    - Pages must not redundantly reimplement requireUser().


searchParams Prop Contract (Required)

    - searchParams must be resolved in each page.tsx and passed explicitly as props.
    - The shared component must not depend on implicit searchParams injection.

    - The shared component prop interface must avoid reserved keywords.

        Required prop names:

            messageParam?: string | null
            deleteParam?: string | null

        The term "delete" must not be used as a prop name.


Colocated Client Component Refactor (Required)

    The following client components must move out of the legacy route directory:

        /app/account/pending-refresher.tsx
        /app/account/delete-account-control.tsx

    Relocate to neutral shared location:

        /app/_components/pending-refresher.tsx
        /app/_components/delete-account-control.tsx

    Rule:

        - The shared account component must import these only from neutral locations.
        - No shared component may import from legacy route folders.


Implementation Ordering (Required)

    To avoid broken imports during refactor, changes must be applied in this order:

        1. Move pending-refresher.tsx → /app/_components/
        2. Move delete-account-control.tsx → /app/_components/
        3. Create shared account UI component importing the moved client components.
        4. Create /app/app/account/page.tsx rendering the shared component.
        5. Convert /app/account/page.tsx into a redirect stub after shared component exists.


Single Source of Truth Rule (Required)

    There must be exactly one source of truth for:

        - billing state rendering
        - pending activation logic
        - delete blocked message handling
        - Stripe success/cancel message handling


Step 3 — Migrate Stripe Return URLs (Required)

    File:
        /lib/billing/stripe.ts

    Update:

        successUrl
        cancelUrl
        portalReturnUrl

    From:

        /account...

    To:

        /app/account...

    After this change:

        Stripe Checkout success → /app/account?message=checkout-success
        Stripe Checkout cancel  → /app/account?message=checkout-canceled
        Billing portal return   → /app/account

    Stripe return behavior must remain otherwise identical.


Step 4 — Convert /account to Legacy Alias (Required)

    /account must remain a valid route.

    Behavior:

        - Must redirect to /app/account.
        - Must preserve ALL query parameters.
        - Must remain protected by middleware.

    Query Preservation (Required)

        - Implementation must support string and string[] values.
        - Do not cast searchParams as Record<string, string>.

        - Multi-value params must serialize deterministically.

        Note:
            The app currently uses only single-value params,
            but implementation must not silently coerce types.


Step 5 — Update Auth-Flow Redirect Destinations (Required)

    Redirects that currently land users at /account
    after authentication or initial entry must be updated.

    Required updates:

        - app/login/page.tsx
              router.push("/account")
                  → router.push("/app")

        - app/signup/page.tsx
              router.push("/account")
                  → router.push("/app")

        - app/auth/callback/route.ts
              redirect("/account")
                  → redirect("/app")

        - app/page.tsx
              redirect("/account")
                  → redirect("/app")

    Rule:

        Authentication entry and completion routes must land at /app.
        Billing return routes must land at /app/account.


Step 6 — Update Internal Redirects for Blocking and Billing Completion (Required)

    Any redirect targeting /account due to:

        - billing completion messaging
        - deletion blocking

    must be updated to:

        /app/account

    Example:

        redirect("/account?delete=blocked")
            → redirect("/app/account?delete=blocked")


Step 7 — Middleware Protection (Required)

    Middleware must protect:

        - /app/*
        - /account
        - /confirm-delete-account
        - /app/account

    Requirements:

        - /app must be protected via prefix-based matching.
        - /account must remain protected even as a redirect stub.
        - No previously protected route may become unprotected.


Acceptance Criteria (Must Pass)

    Authentication

        - Unauthenticated visit to /app redirects to /login.
        - Unauthenticated visit to /app/account redirects to /login.
        - Unauthenticated visit to /account redirects to /login (not to /app/account).
        - Login redirects to /app.
        - Signup redirects to /app.
        - Auth callback completion redirects to /app (not /app/account).

    Stripe

        - Stripe success returns to:
              /app/account?message=checkout-success
          and renders correctly.

        - Stripe cancel returns to:
              /app/account?message=checkout-canceled
          and renders correctly.

        - Billing portal returns to:
              /app/account
          and renders correctly.

    Legacy Compatibility

        - Visiting /account (authed) redirects to /app/account.
        - Query parameters are preserved.

    Deletion Block

        - /confirm-delete-account when blocked redirects to:
              /app/account?delete=blocked
        - Block message behavior remains correct.


Output Requirements

    Implementation must provide:

        - List of changed files
        - Confirmation that Stripe URLs now target /app/account
        - Confirmation that auth-flow redirects now target /app
        - Confirmation that /account preserves query params correctly
        - Confirmation that /account remains protected by middleware
        - Confirmation that prefix-based middleware protection is implemented for /app/*
        - Confirmation that shared components do not import from legacy route folders
        - No unrelated refactors
