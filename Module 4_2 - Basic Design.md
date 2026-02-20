# Module Four – Matching the MigVox Site Design

## Goal

Bring the authenticated **/app** UI into visual alignment with **MigVox.com** by:

- Enforcing MigVox design tokens (Tailwind v4 `@theme` system) through real UI usage
- Implementing a MigVox-derived **/app shell** top navigation bar
- Implementing a MigVox-aligned **/app shell** footer
- Standardizing layout rhythm (surface background + centered container + primary panels)
- Integrating the **MigVoxForWriters** app logo in the correct place

Tokens alone do almost nothing visually.  
The visible change comes from structural layout and consistent component usage.

---

## Non-Breaking Constraints (Strict)

These constraints are mandatory. Module Four is *look-and-feel only*.

1. Do not change auth redirect behavior.
    - Any existing redirects between `/login`, `/signup`, `/app`, and `/` must remain unchanged.

2. Do not weaken or refactor auth guards.
    - Existing guard patterns (including those established in Module Three) must remain intact.
    - The `/app` shell must remain auth-aware without breaking unauthenticated routes.

3. Layout auth-awareness rule (Required)
    - In the **/app shell layout** (`app/app/layout.tsx`), use `getCurrentUser()` (not `requireUser()`) for auth-aware rendering decisions.
    - Do not introduce new redirects from layout-level logic.

4. Do not change Server Action signatures.
    - No Server Action function names, parameters, or return shapes may change as part of UI refactors.

5. Do not change Stripe behavior or billing flows.
    - Checkout routes, entitlement logic, webhook flows, and portal routing remain unchanged.

6. Do not change established `searchParams` contracts.
    - Any query param conventions introduced in Modules Two/Three (e.g. `?message=...`, `?delete=blocked`) must not be altered.

---

## Scope

This module applies to:

- The authenticated app shell only:
  - `app/app/layout.tsx` (wraps `/app/*` routes)
- Primary authenticated landing screens:
  - `/app/account` (and any existing `/app/*` pages used as the post-auth entry)
- Public auth screens (visual alignment only, no behavior changes):
  - `/login`
  - `/signup`

This module does **not** replicate marketing-only layout theatrics such as:

- Hero portrait splits
- Background hover image swaps
- Animated submenu pulses
- Parallax effects

---

## Status Note (Already Implemented)

The following items were implemented earlier (Supporting Module + Module Three) and must **not** be re-implemented unless regression is discovered:

- MigVox token mapping in `app/globals.css` (Tailwind v4 `@theme inline`)
- Font loading in the root layout (as established previously)

Module Four treats these as existing foundations.

---

## Success Criteria

1. The authenticated `/app` experience clearly belongs to MigVox.
2. Top bar and footer create a consistent black-frame brand envelope **inside `/app` only**.
3. Primary actions consistently use MigVox red-orange (`#ff5e3a`).
4. Typography hierarchy reflects MigVox editorial tone.
5. No ad hoc colors, fonts, radii, or shadows exist outside token definitions.
6. The app logo is integrated without breaking brand hierarchy.
7. Logout behavior remains correct (Server Action submission, no fake routes).

---

# Core Visual Identity (From MigVox.com)

## Top Bar (Marketing Reference)

- Full-width black background (`#000000`)
- Accent red text (`#ff5e3a`)
- Serif brand typography
- Right-aligned navigation links
- Flat (no heavy shadows)

## Footer (Marketing Reference)

- Full-width black background
- Light text
- Simple, authoritative
- Minimal decoration
- Clean typographic presentation

---

# Authenticated App Shell Structure (Required)

This structure applies to `/app/*` routes only and must be implemented in `app/app/layout.tsx`:

    [ Top Bar – Black ]
    [ App Content – Surface Background ]
    [ Footer – Black ]

Do NOT implement this structure in `app/layout.tsx` (root layout), because that would apply the black frame to unauthenticated routes.

---

# Top Bar – MigVox Variant (Required)

## Intent

The `/app` experience must clearly inherit MigVox.com’s identity.  
This is brand continuity, not decoration.

## Implementation Target (Required)

- Implemented in: `app/app/layout.tsx`
- Must not appear on: `/login`, `/signup`, or other non-`/app` routes

## Visual Requirements

- Full-width black background (`#000000`)
- Accent red brand text (`#ff5e3a`)
- Inner content constrained to `max-w-container`
- No heavy shadow
- Clean flex layout

## Required Destinations

Minimum:

- Brand “MigVox.com” → `https://migvox.com`
- Contact → `https://migvox.com/migvox-home/contact/`

## Auth-Aware Nav Items

When authenticated:
- Contact (external link)
- Account (internal link)
- Logout (Server Action form submission)

When not authenticated (only relevant if the shell ever renders without user):
- Contact (external link)
- Login (internal link)
- Signup (internal link)

## CRITICAL: Logout Must Be a Server Action Form (Required)

Logout is implemented via a Server Action (`logout()`), therefore it MUST be rendered as a form submission.

Required structure (no invented logout routes):

    <form action={logout}>
      <button type="submit">Logout</button>
    </form>

Prohibited implementations:

- `<Link href="/logout">Logout</Link>`
- `<a href="/logout">Logout</a>`
- Any client-side router navigation for logout
- Any invented logout URL/route

Styling requirement:

- The `<button>` must be styled to look like the other nav items (text link appearance), but must remain a submit button inside a form.

## Layout Auth-Awareness Rule (Required)

- Use `getCurrentUser()` to determine whether to render Account/Logout.
- Do not redirect or hard-guard in the layout solely to compute nav state.
- Do not call `requireUser()` inside the layout for nav rendering decisions.

## Typography

- Brand: `Noto Serif Display`
- Nav items: `Noto Sans Display`

## Color Variant

Variant B – App Usability Bias:
- Brand in accent red
- Nav items in white
- Hover shifts nav items to accent red

---

# Footer – MigVox Alignment (Required)

The `/app` footer must visually align with MigVox marketing tone.

## Implementation Target (Required)

- Implemented in: `app/app/layout.tsx`
- Must not appear on: `/login`, `/signup`, or other non-`/app` routes

## Visual Requirements

- Full-width black background (`#000000`)
- Light text (`#ffffff` or subtle white)
- Inner container constrained to `max-w-container`
- Flat (no heavy shadow)

## Minimum Content

- `© 2026 ProximaFlux LLC`
- Optional:
  - Link to MigVox homepage
  - Link to Contact page

## Typography

- Body font (`Noto Sans Display`)
- 14–16px size
- Comfortable line-height (1.5–1.6)

## Do NOT

- Add multi-column marketing footer layout
- Add background images
- Over-style with accent colors
- Introduce unnecessary decorative elements

---

# Shared UI Components (UI Kit)

## Location (Required Consistency)

Module Three established `app/_components/` as the shared component home.

Standardize on:

- `app/_components/ui/`

Do not create a parallel `/components/ui/` directory.

## Required Components

### 1. Button

Variants:
- Primary
- Secondary
- Ghost
- Destructive

Rules:
- Primary uses accent (`#ff5e3a`)
- Radius = `rounded-btn` (~3px)
- Padding matches MigVox (13px 15px)
- Visible focus state
- Subtle hover shift

### 2. Input

Rules:
- Neutral background
- Border uses token color (`border-card-border`)
- Softer radius than button (~8–10px)
- Accent focus ring
- Error state uses danger red (`#ff3427`)

### 3. Card

Rules:
- White background
- Rounded ~28px
- Minimal shadow
- Border-weight hierarchy (below)

### 4. PageContainer

Rules:
- Centers content
- Constrains width to `1170px` (`max-w-container`)
- Standardized padding and vertical rhythm
- Used on every `/app` page

---

# Border-Weight Hierarchy (Clarified Implementation)

Important: `border-card-border` sets border COLOR, not border WIDTH.

Border thickness must be applied explicitly using Tailwind width utilities.

Required weight conventions:

- Primary panels: `border-[5px] border-card-border`
- Secondary panels: `border-2 border-card-border`
- Inputs/dividers: `border border-card-border` (1px)

This hierarchy is required to reproduce MigVox’s “border-forward, low-shadow” depth.

---

# Typography Hierarchy (App)

- Page Title → Serif (~40px, lh 1.1)
- Section Heading → Serif (~32px, lh 1.2)
- Body → Sans 16px, lh 1.7
- Labels/helper text → 14–15px

No decorative typography.

---

# Implementation Order (Corrected Targets)

## Step 1 – Verify Tokens (No Re-implementation)
Confirm MigVox tokens exist and are correct in `app/globals.css`.
Do not rewrite tokens unless a regression is found.

## Step 2 – Verify Fonts (No Re-implementation)
Confirm fonts are loaded and applied as established previously.
Do not change font loading unless the rendered UI is falling back incorrectly.

## Step 3 – Replace Existing `/app` Nav with MigVox Top Bar (Required)

Target file:
- `app/app/layout.tsx`

This step REPLACES the existing `<nav>` element in the `/app` shell.

Do NOT:
- Add a second navigation bar
- Stack a new top bar above the existing nav
- Wrap a new nav around the old nav
- Leave the original nav in place

### Required Import Update (Required)

If the file currently contains:

    import { getCurrentUser } from "@/lib/auth";

It must be updated to:

    import { getCurrentUser, logout } from "@/lib/auth";

`logout` must be imported in order to use it in the Server Action form.

---

### Required Action

1. Remove the existing `<nav>` implementation.
2. Replace it entirely with the MigVox top bar variant defined in this module.
3. Preserve existing auth-awareness behavior:
    - Continue using `getCurrentUser()` to determine nav state.
    - Render Account link only when authenticated.
    - Render Logout as a Server Action form:

        <form action={logout}>
          <button type="submit">Logout</button>
        </form>

4. Ensure no new routes or logout URLs are introduced.
5. Ensure layout behavior and routing remain unchanged.

The result must be:

    [ MigVox Top Bar (Black) ]
    [ App Content ]
    [ MigVox Footer (Black) ]

There must be exactly one top navigation bar in `/app`.


## Step 4 – Logo Integration (Required)

Target file:
- `/app/account` page implementation (e.g. the file that renders Account UI)

### Structural Clarification (Required)

Current structure places `<h1>Account</h1>` directly inside `<main>` (not inside any Card).
To satisfy “logo above title” AND “inside a primary Card” without guessing:

- Create a NEW primary Card at the top of `<main>` that wraps:
    - the MigVoxForWriters logo
    - the existing `<h1>Account</h1>`

This replaces the standalone heading by moving it into the new Card, but the heading text and semantics remain unchanged.

Do NOT:
- Put the logo into the existing user-info card if it does not contain the `<h1>`
- Leave the `<h1>` outside while placing the logo inside a different card
- Duplicate the `<h1>`

### Rendering Requirement (Required)

The logo MUST be rendered using Next.js `<Image>` from `next/image`.

Required usage pattern:

    import Image from "next/image";

    <Image
      src="/MigVoxForWriters-Logo1.png"
      alt="MigVox for Writers"
      width={96}
      height={96}
    />

Rules:
- `width` and `height` must be explicitly defined.
- Do not rely on `fill` for this use case.
- Maintain aspect ratio.
- PNG must retain transparency.
- Do not upscale beyond native resolution.

### Placement (Required)

Inside the NEW primary Card at the top of `<main>`:

    [ Primary Card – border-[5px] border-card-border rounded-card shadow-card ]

        [ Logo centered ]
        <h1>Account</h1>

        (Optional: brief helper text if already present elsewhere; do not add marketing copy)

Spacing Requirements:
- Logo centered horizontally
- 24–32px margin below logo before `<h1>`
- No decorative borders around logo
- No background behind logo

### Content Integrity Rule (Required)

This module is visual-only.

- Do NOT change `<h1>Account</h1>` text.
- Do NOT inject new marketing copy.
- Do NOT change auth logic, entitlements logic, or searchParams behavior.

Color Discipline:
- Blue from logo is NOT a UI accent.
- Do NOT use logo blue for buttons or links.
- Red (`#ff5e3a`) remains the only action color.


## Step 5 – UI Kit
Create or refactor shared primitives under:
- `app/_components/ui/`

Ensure primitives only use token-driven styles.

## Step 6 – Refactor Anchor Screens (Correct Routes)
Apply consistent styling to:
- `/login` (not `/app/login`)
- `/signup` (not `/app/signup`)
- `/app/account`

Constraints:
- No behavior changes (auth, redirects, server actions, searchParams).
- Visual refactor only.

---

# Exit Checklist

- `/app` top bar matches MigVox tone and links to homepage + contact.
- Logout renders as a Server Action `<form action={logout}>` submit button (not a Link).
- `/app` footer matches MigVox tone and includes © 2026 ProximaFlux LLC.
- Top bar/footer appear ONLY in `/app/*` routes (not on `/login` or `/signup`).
- App logo is integrated (from `/public/MigVoxForWriters-Logo1.png`) without replacing MigVox branding.
- Accent red is the only action color.
- No raw hex values in page components.
- Fonts render correctly (Noto Serif + Noto Sans).
- No auth flows, redirects, Stripe behavior, server actions, or query param contracts were changed.

---

# Architectural Outcome

The authenticated app is visually framed by the same black authority bands  
(top bar + footer) as MigVox.com.

MigVox = system philosophy.  
Blue fist logo = writers within that system.

The app feels deliberate, unified, and brand-consistent, without breaking any existing behavior.
