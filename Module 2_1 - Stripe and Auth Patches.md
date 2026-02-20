# Patches to Auth and Stripe 

# Patch #2.01: AUTH Block Account Deletion Unless Subscription Is Safely Terminated
Goal
    Prevent account deletion while a Stripe subscription may still be billing.
    Account deletion is allowed only when billing status is confirmed terminated or no subscription exists.

Patch Scope (Strict)
    The only code file permitted to change is:
        /lib/auth/actions.ts

    The only function permitted to change is:
        deleteAccount()

    No other files may be modified.
    No Stripe API calls are introduced in this patch.

Definitions
    Safe-to-delete subscription states are:
        "canceled"
        "incomplete_expired"

Required Behavior
    Before deleting the Supabase Auth user, deleteAccount() must check the user’s entitlement status in Supabase.

    Case A: No entitlements row exists
        Deletion may proceed.

    Case B: entitlements.stripe_status is one of:
        "canceled"
        "incomplete_expired"
        Deletion may proceed.

    Case C: entitlements.stripe_status = "active"
        Deletion must be blocked.
        Return error message:
            "Apologies, you cannot delete an account with an active subscription. Please click 'Manage Subscription' and cancel your subscription first."

    Case D: Any other stripe_status value
        Deletion must be blocked.
        Return error message:
            "Apologies, but our records show your subscription is in an unexpected state. Please contact customer support."

Notes
    The application does not attempt to normalize or reinterpret Stripe statuses beyond the values listed above.
    Subscription cancellation must be initiated by the user via Stripe Billing Portal.
    Entitlement status is updated only via verified webhooks.

Rejected Options
    Do not cancel Stripe subscriptions as part of deleteAccount().
    Do not add Stripe API calls to /lib/auth/actions.ts.
    Do not modify Module One routes, middleware, or UI outside deleteAccount().

---

# Patch #2.02: STRIPE Pending Activation State
Goal
    Provide a durable, re-detectable “Pending activation” state on /account after Stripe Checkout.
    Prevent duplicate subscription attempts during webhook processing delays.
    Ensure UI state is derived from durable server-side facts, not URL parameters.

Patch Scope (Strict)
    Only the following file may be modified:
        /app/account/page.tsx

    No new API routes may be added.
    No new database tables or columns may be added.
    No new npm dependencies may be added.

Definitions

    Active Subscription
        entitlements row exists AND entitlements.stripe_status = "active"

    UI Non-Active States (Not Pending)
    These statuses must not display the Pending indicator:
        "canceled"
        "incomplete_expired"
        "paused"

    Pending Activation (Derived State)
        billing_customers row exists
        AND (no entitlements row exists OR entitlements.stripe_status != "active")

Required UI Behavior

    Case 1: Active Subscription
        Show:
            “Manage Subscription” button
        Do not show:
            “Subscribe”
            “Pending” indicator

    Case 2: Pending Activation (Derived)
        Show:
            “Pending activation…” indicator
            “Manage Subscription” button
        Do not show:
            “Subscribe”

    Case 3: Not Subscribed
        Condition:
            billing_customers row does not exist
            AND no active entitlement exists
        Show:
            “Subscribe” button

    Case 4: Ambiguous / Needs Attention
        Condition:
            entitlements row exists AND stripe_status is not:
                "active"
                UI Non-Active States (Not Pending)
        Show:
            “Manage Subscription” button
            Informational message indicating subscription requires attention
        Do not show:
            “Subscribe”

Case Priority (Required)
Evaluate cases in this order:
    Case 1 (Active)
    Case 4 (Ambiguous / Needs Attention)
    Case 2 (Pending Activation)
    Case 3 (Not Subscribed)

If multiple case conditions match, the first match in this order wins.

Pending Indicator Behavior

    The Pending state must be derived from database state only.
    It must not rely solely on the presence of ?message=checkout-success.

    When in Pending state:
        Show a "Pending..." animation (such as dev sites use) where the ... after pending are animated.
        A bounded auto-refresh loop may be used.
        The page may trigger router.refresh() every 2 seconds.
        The loop must stop after 130 seconds or once entitlement becomes active.
        A manual “Refresh” control must be available.
        The loop must not run indefinitely.

Client Component File Exception (Required)
    To support bounded auto-refresh, Patch #2 may add exactly one new file:
        /app/account/pending-refresher.tsx

    This file must:
        - Contain "use client"
        - Export a single page-specific component used only by /app/account/page.tsx
        - Implement only the bounded router.refresh() loop and a manual Refresh action
        - Contain no Supabase logic and no Stripe logic
        - Not be reused outside /account

    No other new files are permitted for Patch #2.


Server-Side Integrity

    All subscription state decisions must be derived from Supabase data.
    The client must not determine entitlement state independently.
    The checkout route must continue to enforce duplicate-subscription guards server-side.

Rejected Options

    Do not create a new database “pending” state.
    Do not add background jobs or polling services.
    Do not rely on URL parameters as the sole source of subscription state.
    Do not allow “Subscribe” to appear when billing_customers row exists.
    Do not create shared billing UI abstractions for this feature.

## Patch 2.03 — STRIPE Deterministic Entitlement Activation (Required)

Problem

    Stripe does not guarantee webhook delivery order.
    `customer.subscription.created` may arrive before `checkout.session.completed`.

    When that occurs:
        - The subscription webhook attempts to map `stripe_customer_id` → `user_id`
        - The `billing_customers` row does not yet exist
        - Entitlement upsert is skipped
        - HTTP 200 is returned to Stripe
        - Stripe does not retry
        - User remains indefinitely in "Pending…" state

Root Cause
    Initial entitlement activation currently depends on `customer.subscription.created`.
    That event is not causally ordered after `checkout.session.completed`.
    The system assumes ordering that Stripe does not guarantee.

Design Principle
    Initial entitlement activation must be:
        - Deterministic
        - Order-independent
        - Based on an event that reliably links Stripe to Supabase

    `checkout.session.completed` is the only event that:
        - Contains a reliable Supabase `user_id` reference (`client_reference_id` or metadata)
        - Confirms successful checkout
        - Includes the Stripe `subscription_id` in subscription mode

    Therefore:
        `checkout.session.completed` becomes the authoritative activation event.

Required Changes

    File
        `/lib/billing/webhook.ts`

    Modify only the `checkout.session.completed` handler.
    Note: upserts must be idempotent.
        Multiple deliveries of the same event must not create duplicate rows or inconsistent state.

    1. Identify Supabase User
        Read `user_id` from:
            - `event.data.object.client_reference_id`
            - Fallback: `event.data.object.metadata.user_id`

        If `user_id` cannot be determined:
            - Log clearly
            - Return HTTP 200
            - Do not throw

    2. Upsert billing_customers Mapping
        Read `customer_id` from:
            - `event.data.object.customer`

        If `customer_id` is null or missing:
            - Log clearly
            - Return HTTP 200
            - Do not throw

        Upsert into `billing_customers`:
            - `user_id`
            - `stripe_customer_id`

    3. Deterministically Upsert Entitlements
        Read `subscription_id` from:
            - `event.data.object.subscription`

        If `subscription_id` exists:
            - Retrieve full subscription from Stripe using:
              `stripe.subscriptions.retrieve(subscription_id)`

            - Convert `subscription.current_period_end` from Unix seconds to ISO timestamp:
                - Stripe returns seconds (integer)
                - Convert using:
                  `new Date(subscription.current_period_end * 1000).toISOString()`

            - Upsert into `entitlements`:
                - `user_id`
                - `stripe_subscription_id`
                - `stripe_status` = `subscription.status`
                - `current_period_end` = converted ISO timestamp
                - `updated_at` must be updated

        If `subscription_id` is missing:
            - Log:
              "checkout.session.completed missing subscription_id; entitlements not set"
            - Return HTTP 200
            - Do not throw

Behavioral Guarantees After Patch
    - Entitlements are written deterministically upon successful checkout.
    - The UI "Pending…" state resolves as soon as the checkout webhook lands.
    - Race condition between `checkout.session.completed` and `customer.subscription.created` no longer affects activation.
    - Subscription webhooks remain useful but are no longer required for initial activation.

Timestamp Conversion Guard (Required)

    Stripe subscription fields may be null/undefined depending on lifecycle timing.
    In particular, `subscription.current_period_end` must be treated as OPTIONAL.

    Rule:
        When converting `subscription.current_period_end` into `entitlements.current_period_end (timestamptz)`:

            - If `current_period_end` is a finite number (Unix seconds):
                Convert to ISO timestamp using:
                    new Date(current_period_end * 1000).toISOString()

            - If `current_period_end` is null/undefined/non-finite:
                Write NULL to `entitlements.current_period_end`.

    The webhook must never call `toISOString()` on an invalid Date.

Idempotency Logging Ordering (Required)

    The webhook uses `stripe_events.event_id` for dedupe.

    Rule:
        An event must be persisted into `stripe_events` ONLY AFTER all required business writes for that event complete successfully.
        If a handler throws or fails after partial writes, it must NOT leave a `stripe_events` record behind that would block Stripe retries.

    Acceptable implementations:
        - Insert `stripe_events` after successful completion of:
            - billing_customers upsert (if applicable)
            - entitlements upsert (if applicable)
        - OR perform all writes in a single transaction that guarantees:
            either all writes commit together, or none commit.

Non-Changes
    - `customer.subscription.created` handler remains unchanged.
    - `customer.subscription.updated` handler remains unchanged.
    - `stripe_events` behavior remains unchanged.
    - No database schema changes.
    - No new tables.
    - No retry logic added.
    - No additional state tracking introduced.

Architectural Outcome
    Activation becomes causally tied to successful checkout, not to webhook arrival order.
System moves from:
    Activation dependent on webhook arrival order
to:
    Activation deterministically tied to checkout completion


## Patch 2.04 — AUTH Delete Account Button Must Be Visible, Click-Reveals Block Message (Required)

Intent

    The “Delete Account” control must remain visible on /account at all times.
    The UI must not display deletion-block warnings unless the user explicitly clicks “Delete Account”.
    If deletion is blocked, clicking “Delete Account” must reveal an inline message instead of navigating.
    Direct navigation to /confirm-delete-account must still be blocked server-side.
    If the user attempts URL bypass to /confirm-delete-account while blocked, they must be redirected to /account
    and the same inline block message must be shown automatically (as if they clicked the button).

Canonical Deletion Eligibility Rules (Authoritative)

    These rules are authoritative and must be implemented identically in:

        - /app/account/page.tsx
        - /app/confirm-delete-account/page.tsx
        - /lib/auth/actions.ts (deleteAccount)

    Case A — Eligible (No Billing State)
        billing_customers does NOT exist
        AND entitlements does NOT exist
            → Deletion allowed

    Case B — Blocked (Pending Billing State)
        billing_customers exists
        AND entitlements does NOT exist
            → Deletion blocked
            → Blocked reason: "pending"
            → Message:
                "Apologies, your subscription activation is still processing. Please wait a moment and refresh the page before attempting to delete your account."

    Case C — Entitlement Exists

        SAFE TERMINAL STATES (Deletion Allowed):
            stripe_status == "canceled"
            stripe_status == "incomplete_expired"

        ACTIVE STATE (Blocked):
            stripe_status == "active"
                → Deletion blocked
                → Blocked reason: "active"
                → Message:
                    "Apologies, you cannot delete an account with an active subscription. Please click 'Manage Subscription' and use the Stripe customer dashboard to cancel your subscription first."

        NON-TERMINAL / INELIGIBLE STATES (Blocked):
            Any stripe_status not in:
                - "canceled"
                - "incomplete_expired"
                - "active"

                → Deletion blocked
                → Blocked reason: "terminal_ineligible"
                → Message:
                    "Apologies, your subscription is in a non-terminal state. Please contact customer support before attempting to delete your account."

    Case D — Defensive Fallback (Fail Closed)

        This case must NOT attempt to detect a specific condition.

        It exists purely as the final else branch to ensure fail-closed behavior.

        If execution reaches the final else after evaluating Cases A–C:
            → Deletion blocked
            → Blocked reason: "terminal_ineligible"
            → Use the same message defined under NON-TERMINAL / INELIGIBLE STATES.

        No explicit “unknown status” detection must be implemented.
        Case D is strictly the final catch-all else branch.

Account Page UX (Required)

    /app/account/page.tsx must render a visible “Delete Account” control in all cases.

    Behavior:

        Eligible
            → “Delete Account” navigates to /confirm-delete-account

        Blocked (any reason)
            → “Delete Account” must NOT navigate
            → Clicking reveals the inline blocked message

Message Display Rules

    - The blocked message must NOT render on initial page load.
    - The message appears only after the user clicks “Delete Account”.
    - Once revealed, it may remain visible until refresh or navigation.

URL Bypass Display Rule (Required)

    Dedicated Query Param (Required)

        Use:
            ?delete=blocked

        This must be independent of existing ?message=... flows.

    If /account loads with:
        ?delete=blocked

    Then:

        - The Delete Account control behaves as if clicked.
        - The inline blocked message is shown immediately.
        - The message content must be computed server-side using the Canonical Rules.
        - The URL must never be trusted as a source of message content.

    Edge Case Requirement

        If:
            eligible == true
            AND searchParams.delete == "blocked"

        Then:
            - No blocked message is shown.
            - The button behaves normally.
            - The URL must not be able to manufacture a blocked message.

Implementation Constraint (Required)

    Because click-to-reveal behavior requires client-side state:

        - Implement a minimal Client Component colocated under /app/account/
        - /app/account/page.tsx remains a Server Component
        - It must compute eligibility using the Canonical Rules
        - It must pass:

            eligible: boolean
            blockedReason: "pending" | "active" | "terminal_ineligible" | null
            blockedMessage: string | null
            forceShowBlockedMessage: boolean
                true when searchParams.delete == "blocked"
                false otherwise

Confirm Delete Page Guard (Required)

    /app/confirm-delete-account/page.tsx must:

        - Recompute eligibility using the Canonical Rules
        - If deletion is blocked:
            redirect to:
                /account?delete=blocked
        - Must NOT render confirmation UI when blocked

Server Action Alignment (Required)

    /lib/auth/actions.ts deleteAccount must:

        - Recompute eligibility using the Canonical Rules
        - Abort deletion when blocked
        - Use the exact same blocked messages defined above
        - Not rely solely on entitlements existence

Legacy Behavior Removal (Required)

    Before removing any legacy redirect behavior:

        - Search the codebase for:
            "delete-blocked"
        - If found:
            - Remove all usage of:
                ?message=delete-blocked
            - Remove any logic interpreting:
                searchParams.message === "delete-blocked"
        - If not found:
            - No changes required.

    The only supported redirect mechanism for blocked deletion is:
        /account?delete=blocked

Architectural Outcome

    - Delete control remains visible at all times.
    - UI warnings appear only upon user intent.
    - URL bypass attempts are safely redirected.
    - Eligibility logic is canonical and identical across all enforcement points.
    - System fails closed by design.

## Patch 2.05 — AUTH Logout Must Redirect to Root
Goal

    Ensure that after a user clicks “Logout”, they are redirected to the application root ("/"), not to the login page.

    The root page functions as the marketing / landing page and is the correct post-logout destination.

Patch Scope (Strict)

    The only file permitted to change is:

        /lib/auth/index.ts

    The only function permitted to change is:

        logout()

    No other files may be modified.
    No UI components, routes, or middleware may be modified.
    No authentication logic may be altered beyond redirect behavior.

Required Behavior

    When logout() is invoked:

        - The user must be signed out using the existing Supabase sign-out logic.
        - After successful sign-out, redirect must go to:

            "/"

        - The login page ("/login") must not be used as the post-logout destination.

Behavioral Guarantees After Patch

    - Users are redirected to the marketing root page after logout.
    - Logout does not imply forced navigation to the login form.
    - Authentication state is cleared exactly as before.
    - No change to session invalidation behavior.
    - No change to protected route enforcement.

Non-Changes

    - No modification to /app/login/page.tsx
    - No modification to middleware
    - No modification to Supabase configuration
    - No change to deleteAccount()
    - No change to subscription logic

Architectural Outcome

    Logout becomes a clean exit to the public-facing root experience, instead of looping the user back into the authentication funnel.

# Patch 2.06 - 

