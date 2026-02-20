Module Two is Stripe Integration for single product, with a single price, billed monthly.
    Stripe is the billing source of truth.
    Supabase stores derived entitlements.
    The app gates access based only on Supabase entitlements.

Module One as Stable Dependency:
    Prior to start Review "Module One - Auth Requirements.md" and read all of Module One associated files and code. 
    Module Two must not modify Module One auth behavior, auth routes, or middleware protections. 

Module Two File and Route Constraints: (Required)
    Module Two may create/modify only these files:
        Routes/pages:
            /app/account/page.tsx (modify: show plan status + “Manage” + “Subscribe”)
        API route handlers:
            /app/api/stripe/checkout/route.ts (new)
            /app/api/stripe/portal/route.ts (new)
            /app/api/stripe/webhook/route.ts (new)

Dependencies (Required)
        Module Two must install and use Stripe’s official Node SDK:
        Module Two must not install alternative Stripe wrappers or billing helper libraries.

Library code (Stripe + entitlements logic lives only here):
    /lib/billing/* (new)

Middleware Compatibility: (Required)
    /api/stripe/webhook must be publicly accessible.
    Middleware must allow unauthenticated POST requests to /api/stripe/webhook.
    This exception must not alter protection of:
        /account
        /confirm-delete-account
        any Module One auth routes.

Database:
    Supabase tables + constraints must be created (via SQL editor or migrations). Module Two must not introduce additional DB tables beyond:
        billing_customers
        entitlements
        stripe_events

Server-only Environment: 
    SUPABASE_SERVICE_ROLE_KEY
    Must be available only to server-side code.
    Must be used only inside:
        /app/api/stripe/webhook/route.ts
        /lib/billing/* server logic invoked by webhook
    Must never be exposed to client-side code.

    billing_customers table:
        user_id uuid primary key references auth.users(id) on delete cascade
        stripe_customer_id text not null unique
        created_at timestamptz not null default now()

    entitlements table:
        user_id uuid primary key references auth.users(id) on delete cascade
        stripe_subscription_id text not null unique
        stripe_status text not null
        current_period_end timestamptz null
        created_at timestamptz not null default now()
        updated_at timestamptz not null default now()
    updated_at behavior (Required)
        updated_at must be set explicitly on every webhook upsert/update to entitlements.
        No database triggers are introduced in Module Two.

    stripe_events table:
        event_id text primary key
        event_type text not null
        created_at timestamptz not null default now()

    Indexes:
        index on entitlements.stripe_status
        index on billing_customers.stripe_customer_id

    RLS:
        Row Level Security must be enabled.
        Users may read only their own billing_customers and entitlements rows.
        Users must not insert, update, or delete billing tables.

Stripe Environment: (Required)
    Environment variables:
    Sandbox:
    STRIPE_SANDBOX_SECRET_KEY
    STRIPE_SANDBOX_PUBLISHABLE_KEY
    STRIPE_SANDBOX_PRICE_ID
    STRIPE_SANDBOX_WEBHOOK_SECRET

    Live:
    STRIPE_LIVE_SECRET_KEY
    STRIPE_LIVE_PUBLISHABLE_KEY
    STRIPE_LIVE_PRICE_ID
    STRIPE_LIVE_WEBHOOK_SECRET

    Selector:
    STRIPE_MODE (sandbox | live)

    Resolution rule:
    If STRIPE_MODE=sandbox → use SANDBOX variables.
    If STRIPE_MODE=live → use LIVE variables.
    All Stripe operations must use the resolved values.
    Mode is determined at startup only.

Customer-to-User Mapping (Required)
    The checkout route must set Stripe Checkout Session client_reference_id to the authenticated Supabase user ID (auth.users.id).
    The checkout route must also set checkout session metadata.user_id to the authenticated Supabase user ID.

On checkout.session.completed:
    The webhook must read client_reference_id (or metadata.user_id) to obtain the Supabase user ID.
    The webhook must read the Stripe customer ID from the event/session.
    The webhook must upsert billing_customers for that user:
        billing_customers.user_id = Supabase user ID
        billing_customers.stripe_customer_id = Stripe customer ID

Application Environment (Required)
    APP_BASE_URL
        Sandbox example: http://localhost:3000
        Live example: https://your-production-domain.com
        Must represent the public origin of the running application.
        Must be used to construct absolute Stripe redirect URLs.

Webhooks Rules: (Required)
Stripe webhook endpoint must subscribe only to these events:
    checkout.session.completed
    customer.subscription.created
    customer.subscription.updated
    customer.subscription.deleted

Webhooks are verified and idempotent.
        Raw Body Requirement (Required)
            /app/api/stripe/webhook/route.ts must verify the Stripe signature using the raw request body.
            The webhook route must read the request body exactly once using request.text() (or equivalent raw body read) before any parsing occurs.
            The webhook route must not call request.json() before Stripe signature verification.
            The raw body string and the Stripe-Signature header must be used for verification.
            If signature verification fails, the route must return 400 and must not update the database.
        Stripe signature must be verified using STRIPE_*_WEBHOOK_SECRET for the active mode.
        Stripe event IDs must be persisted and deduplicated (stripe_events.event_id).
        Handler must return 2xx unless there is a real internal failure.
        Logic must be safe under retries and duplicates.

    Entitlements must be derived from Stripe subscription state.
    Entitlement row must be set to match Stripe subscription status exactly.

Event Responsibilities (Required)
    Event: checkout.session.completed
        Purpose:
            Establish user ↔ Stripe customer mapping after a successful checkout.

        Actions:
            Read Supabase user_id from client_reference_id (preferred) or metadata.user_id.
            Read Stripe customer_id from the session.
            Upsert billing_customers (user_id, stripe_customer_id).
            Do not set entitlement active based on redirect return or checkout completion alone.

    Event: customer.subscription.created
        Purpose:
            Create or update the entitlement row when a subscription is created.

        Actions:
            Identify user_id via billing_customers.stripe_customer_id mapping.
            Upsert entitlements for that user:
                stripe_subscription_id
                stripe_status
                current_period_end (if available)
                updated_at

    Event: customer.subscription.updated
        Purpose:
            Keep entitlement status synchronized with Stripe.

        Actions:
            Identify user_id via billing_customers.stripe_customer_id mapping.
            Upsert entitlements for that user with latest:
                stripe_status
                current_period_end (if available)
                updated_at

    Event: customer.subscription.deleted
        Purpose:
            Mark entitlement as no longer active when subscription is cancelled/ended.

        Actions:
            Identify user_id via billing_customers.stripe_customer_id mapping.
            Update entitlements for that user:
                stripe_status = “canceled” (or the Stripe-provided status)
                updated_at
            Do not delete entitlements rows.

    Global Event Rules (apply to all events)
        If checkout session fails, user just retries.
        If Stripe temporarily fails, retries safely.
        Entitlement is considered active only when stripe_status equals “active”.
        All entitlement writes occur only inside the webhook using SUPABASE_SERVICE_ROLE_KEY.
        Webhook processing must be idempotent using stripe_events.event_id dedupe.
        If user mapping cannot be resolved, log and return 200.
        updated_at must be set to now() on every entitlement write.


    Module Two does not introduce new paid-only feature routes.
    Module Two must only ensure entitlement can be read server-side and displayed on /account.
    Clear logging of webhook receipt and processing outcome.
    A way to manually inspect a user’s entitlement state.
    Ability to see which Stripe event updated which user.

Account Page UX (Required)
    /app/account/page.tsx must serve as the canonical subscription lifecycle page.
    /app/account/page.tsx must display the user’s current subscription status (derived exclusively from Supabase entitlements).
    If no entitlements row exists for the user, entitlement is treated as not active.
        If the user is not subscribed (entitlement not active):
            /account must display a “Subscribe” action that initiates a Stripe Checkout session via /api/stripe/checkout.
                Stripe Checkout must be configured with:
                    If STRIPE_MODE=sandbox:
                        success_url = http://localhost:3000/account?message=checkout-success
                        cancel_url  = http://localhost:3000/account?message=checkout-canceled

                    If STRIPE_MODE=live:
                        success_url = APP_BASE_URL + "/account?message=checkout-success"
                        cancel_url = APP_BASE_URL + "/account?message=checkout-canceled"

        If the user is subscribed (entitlement active):
            /account must display a “Manage Subscription” action.
            The “Manage Subscription” action must create a Stripe Billing Portal session server-side via /api/stripe/portal.
            The user must be redirected to the Stripe-hosted Billing Portal URL.
            The Billing Portal return URL must be configured to redirect back to /account.
                
    /account must not call Stripe directly from the browser.
    All Stripe interactions must be initiated via server routes under /api/stripe/*.
    Subscription state must not be modified based on redirect return from Stripe. 
    Subscription state changes must occur only via verified webhooks.

Compatibility Notes (Required)
Module Two must use Stripe’s official Node SDK for server-side calls only.
Module Two must use Next.js App Router route handlers for:
    /api/stripe/checkout
    /api/stripe/portal
    /api/stripe/webhook
Module Two must not introduce alternative Stripe abstractions or third-party billing libraries to “solve” framework uncertainty.
If framework/documentation gaps occur, prefer minimal, direct implementations inside the allowed files rather than adding architecture.

Rejected Options:
Do not switch Stripe modes at runtime. Stripe mode is determined only by STRIPE_MODE at startup.
Do not mix Sandbox and Live identifiers within the same runtime.
Do not hardcode Stripe keys, Price IDs, or webhook secrets in source code.
Do not expose Stripe secret keys or webhook signing secrets to client-side code.
Do not place Stripe API logic inside page files. Page files may only call helpers from /lib/billing.
Do not place Stripe logic in middleware.
Do not create shared billing UI component abstractions.
Do not create more than one Stripe server client. A single Stripe client must live inside /lib/billing.
Do not create additional API routes beyond:
    /api/stripe/checkout
    /api/stripe/portal
    /api/stripe/webhook
Do not implement coupons, discount codes, or promotional pricing.
Do not implement trial periods.
Do not implement multiple plans or pricing tiers.
Do not implement seat-based subscriptions.
Do not implement usage-based billing or metered billing.
Do not model invoices internally in Supabase.
Do not build a billing history dashboard inside the app.
Do not introduce a feature-flag system tied to billing.
Do not introduce background polling or synchronization jobs for Stripe state.
Do not mutate subscription state incrementally. Subscription status must always be set to match Stripe’s reported state.
Do not implement logic such as “if active then flip.”
Do not implement usage counters or increment subscription values inside billing logic.
Do not rely on client-side checks to enforce paid access.
Do not hide UI elements while leaving protected endpoints accessible.
Do not log full Stripe payloads that may contain personally identifiable information.
Do not bypass auth middleware for any Stripe routes other than /api/stripe/webhook.
Do not parse the webhook request body as JSON before signature verification.
Do not verify Stripe signatures using a parsed object.
Do not use SUPABASE_SERVICE_ROLE_KEY in client-side code.
Do not use SUPABASE_SERVICE_ROLE_KEY in checkout or portal routes.
Do not introduce a new billing framework, billing wrapper library, or template-based SaaS starter to address compatibility uncertainty.
Do not create billing_customers or entitlements rows from the checkout route.
Do not introduce Postgres triggers for updated_at in Module Two.

