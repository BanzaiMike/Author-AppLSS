# Patch Style Iterations on the Look and Feel of the MigVox App

---

# Patch 4.01 — Eliminate White Text on White Background
Goal  
    Ensure no readable text renders as white (or near-white) on a white or light background in light mode or dark mode.
    Make card and content foreground colors token-aware and non-fragile.
    Restore proper contrast across the authenticated `/app` experience.

Scope (Strict)  
    This patch applies only to visual styling within:

        - app/app/layout.tsx
        - app/_components/ui/*
        - /app/account and other `/app/*` pages
        - /login
        - /signup

    Do NOT modify:
        - Server Actions
        - Auth logic
        - Stripe logic
        - Route structure
        - Middleware
        - Query parameter behavior

Definitions  

    Light Background  
        Any background using:
            bg-background
            bg-surface
            bg-white
            #ffffff
            #f7f7f7
            or any token resolving to a light color.

    White Text  
        Any use of:
            text-white
            text-neutral-50
            text-slate-50
            text-zinc-50
            text-foreground where foreground resolves to white in light mode
            or where foreground + background yields unreadable contrast.

Required Behavior  

    Case A — Light Background Containers  
        Any element rendered on a light background must use:
            text-foreground
        and foreground must resolve to a dark readable color in light mode.

        Cards and content surfaces must explicitly set text color using tokens
        rather than relying on inheritance.

    Case B — Dark Frame Exception (Header/Footer)  
        White text is permitted ONLY when the background is explicitly dark:

            bg-black
            bg-dark-bg (#0d1117)

        Therefore:
            - The `/app` top bar (header) may use text-white on bg-black.
            - The `/app` footer may use text-white on bg-black.

        These are intentional and must not be “fixed.”

    Case C — Card Defaults (Required)  
        All primary and secondary Cards must default to:

            bg-background
            text-foreground

        Cards must not:
            - use bg-white without an explicit token-aware text color
            - inherit text-white from a parent container

    Case D — Token Verification (Required)  
        In light mode:

            :root
                --background must resolve to white or near-white
                --foreground must resolve to a dark readable color

        In dark mode (if supported):

            --background may resolve to dark
            --foreground may resolve to light

        Token-based cards MUST remain readable in both modes:
            bg-background + text-foreground must not produce white-on-white or black-on-black.

Implementation Rules  

    1. Codebase search (Required)
        Search for:
            text-white
            text-neutral-
            text-slate-
            text-zinc-
            bg-white

    2. Remove invalid white text usage (Required)
        Remove text-white (or near-white text classes) ONLY when applied to
        content wrappers or cards that sit on light backgrounds, including:
            - <main> content wrappers
            - PageContainer wrappers
            - Card components
            - Account page top-level wrappers
            - Login and Signup wrappers
            - Inline “card-like” divs

        IMPORTANT EXCEPTION:
            Do NOT remove text-white from the `/app` header or footer when they are on bg-black.
            (Header/Footer are covered by Case B.)

    3. Enforce token-aware surfaces (Required)
        Ensure layout structure follows:

            Top Bar  → bg-black text-white
            Main     → bg-surface text-foreground
            Cards    → bg-background text-foreground
            Footer   → bg-black text-white

    4. Replace bg-white usage in Cards (Required)
        Wherever a “card” surface exists (component or inline),
        replace:

            bg-white

        with:

            bg-background text-foreground

        unless the card is intentionally a dark surface (rare, and must be explicit).

    5. No inline hex “fixes” (Required)
        Do NOT introduce inline hex colors or style= overrides.
        Use token utilities only.

Non-Changes  

    - Do not alter typography hierarchy.
    - Do not change spacing scale.
    - Do not modify border thickness rules.
    - Do not change accent color usage.

Acceptance Criteria  

    - No white or near-white text appears on white or light surfaces in light mode.
    - In dark mode (if enabled), cards remain readable (no white-on-white due to bg-white).
    - Header and footer remain white-on-black.
    - All card-like surfaces explicitly use bg-background text-foreground.
    - No regressions in auth flows, Stripe flows, routing, or query param behavior.

Architectural Intent  

    MigVox is editorial and high-contrast.
    Content must be dark-on-light in light mode.
    White text is reserved for deliberate black-frame zones only.

## Patch 4.02 — APP Navigation Header and Footer Correction

Goal

    Correct the /app navigation layout so that:

        - The parent-site link (MigVox.com) is moved to the footer.
        - The official App logo appears in the header.
        - The App header branding links internally to /app.

    The header must represent the application.
    The footer may reference the parent site.

Patch Scope (Strict)

    The only file permitted to change is:

        /app/app/layout.tsx

    No other files may be modified.
    No routing logic may be altered.
    No components may be duplicated into page files.

Current Behavior

    The header contains a text element:

        "MigVox.com"

    This element links to:

        https://www.migvox.com

Required Changes

Action 1 — Move Parent Site Link to Footer

    - Remove the "MigVox.com" element from the header.
    - Add it to the bottom-right corner of the footer.
    - It must continue to link to:

        https://www.migvox.com

    - It must not link internally.
    - Footer placement must be visually aligned right.

Action 2 — Add Official App Logo to Header (Top Left)

    Insert the following Image component into the top-left of the header:

        <Image
          src="/MigVoxForWriters-Logo1.png"
          alt="MigVox for Writers"
          width={36}
          height={36}
        />

    - The image must render at 36x36.
    - The image file must exist in /public.
    - The image must not link externally.

Action 3 — Add Application Title Next to Logo

    Add header text next to the logo:

        "MigVox for Authors"

    Requirements:

        - Must visually align horizontally with the logo.
        - Must match existing header typography styling.
        - Must not introduce new styling systems.
        - Must remain consistent with current header spacing.

Action 4 — Internal Link Behavior

    The following must link to:

        "/app"

        - The logo image
        - The "MigVox for Authors" title text

    These must function as a unified branding link to /app.

Non-Changes

    - No changes to authentication logic.
    - No changes to Stripe or billing logic.
    - No changes to middleware.
    - No new components may be created.
    - No new dependencies may be added.

Architectural Outcome

    - Header represents the App.
    - Footer references the parent company.
    - Branding is internally consistent.
    - External navigation is clearly separated from application navigation.


## Patch 4.03 — Look and Feel of / page (Root Marketing Page)
Goal
    Refactor ONLY the visual layout and presentation of the root page ("/") so it reads as an
    institutional, research-grade landing page for a controlled pilot.

    This patch MUST:
        - Keep existing app functionality unchanged (routes, auth, Stripe, logic, behavior).
        - Preserve the existing Login and Signup buttons and their navigation targets.
        - Make Login and Signup ever-present in a simple top-right navigation area on "/".
        - Implement the new sectioned marketing layout (Hero → Problem → Experiment → Governance → Research → Participation).
        - Use the curated image set in a restrained editorial manner.

Scope (Strict)
    This patch applies only to:
        - app/page.tsx
        - public/marketing/* (new image assets only)

    Do NOT modify:
        - Any /app/* authenticated routes
        - app/app/layout.tsx
        - /login and /signup pages (logic or behavior)
        - Auth logic (Supabase)
        - Stripe logic
        - Middleware
        - Server Actions
        - Database
        - Shared UI component library files (app/_components/ui/*), unless they are already imported by app/page.tsx

Non-Negotiable Guardrails (Required)
    1) No behavior changes.
        - The Login button MUST still navigate to "/login".
        - The Signup button MUST still navigate to "/signup".
        - Do not change query params, redirects, middleware, or auth flows.
        - Do not change button text semantics beyond casing (keep “Log in” / “Sign up” acceptable).

    2) No new dependencies.
        - Do not add packages.
        - Do not introduce new routing patterns.

    3) No component duplication into other files.
        - All changes remain inside app/page.tsx (plus adding marketing images to /public/marketing/*).

    4) Visual refactor only.
        - Moving, restyling, or wrapping the existing Login/Signup buttons is permitted.
        - Replacing their visual styling is permitted.
        - Changing what they do is NOT permitted.

Asset Requirements (Required)
    Add the following six images to the repo under:
        /public/marketing/

    Use exactly these filenames:
        writers-guild-noir.png
        pen-over-paper-slope.png
        gavel-glitch.png
        writer-desk-chaos.png
        typewriter-text-collage.png
        writer-procrastination-paint.png

    All images must be served via next/image from /public/marketing/*.
    Provide explicit width/height props and responsive sizing.
    Provide meaningful alt text.

Current Behavior (Baseline)
    The root ("/") currently presents a minimal centered layout with:
        Title: "Author App"
        Two buttons:
            - "Log in"  -> /login
            - "Sign up" -> /signup

    This patch must NOT break, remove, rename, or re-route those actions.
    It must only relocate them into a persistent top-right navigation area
    and adjust their look and feel to match the new layout.

Required Layout Specification (Explicit)
    A) Root Page Navigation Bar (New, required)
        Add a simple top navigation bar that appears ONLY on "/"
        (do not touch app/app/layout.tsx).
        Structure:
            Left:
                - MigVox for Authors logo + title (links to "/")
                    Logo: /MigVoxForWriters-Logo1.png (already in /public)
                    Title text: "MigVox for Authors"

            Right (ever-present):
                - "Research Paper" (external link to the provided PDF URL; opens new tab)
                - https://migvox.com/wp-content/uploads/2025/11/Perspective-Economics-A-Post-AI-Model-for-Human-Proof-of-Work-through-a-Self-Moderating-Marketplace-of-Dialogue-.docx.pdf
                - "Log in"  (links to "/login")
                - "Sign up" (links to "/signup")

        Visual hierarchy:

            - "Log in" should be a quiet text link.
            - "Sign up" should be a small outlined button (NOT the primary filled CTA on the page).
            - Keep spacing tight and clean.

        Behavioral constraints:
            - Links MUST be normal Next.js <Link> navigations.
            - Do not introduce any auth checks here.
            - Do not change the /login or /signup pages.

    B) Page Wrapper
        - Outer: min-h-screen bg-surface text-foreground
        - Add top padding so hero content clears the nav (pt-12 or similar)
        - Constrain reading width:
            - Main content max width: max-w-5xl
            - Text blocks max width: max-w-3xl
        - Large consistent vertical section spacing: py-16/py-20

    C) Hero Section (2-column desktop, stacked mobile)
        Left column:
            Headline:
                "Human Authorship in the Age of AI"

            Subheadline:
                "A closed, research-backed pilot to define and defend AI-assisted authorship for professional writers and publishers."

            Micro-line:
                "Five authors. Five publishers. One co-authored legal framework."

            Primary hero CTA (NEW):
                - Button: "Request Participation Materials"
                - Behavior: MUST link to "/signup" (no new route introduced)

            Secondary hero CTA:
                - Button or link: "Read the Research Paper"
                - Behavior: external link opens new tab with rel="noreferrer noopener"

            NOTE:
                This does NOT replace the ever-present nav Login/Signup.
                This is a thematic CTA that still navigates to existing /signup.

        Right column:
            Image: /marketing/gavel-glitch.png
            Style:
                - rounded-2xl
                - border border-border
                - shadow-sm
            Caption (text-muted-foreground):
                "Legal clarity meets machine distortion."

    D) Section: The Problem (split layout)
        Headline:
            "The problem: AI is changing authorship faster than law can follow"

        Copy:
            "Professional authors already use AI during drafting. Publishers need clarity. Courts need definitions. Contracts need language."

            "Today, there is no operational standard that can prove where human authorship lives inside AI-assisted creation."

        Bullets:
            - "Defines AI-assisted authorship in enforceable terms"
            - "Detects human critical thinking inside AI collaboration"
            - "Protects author IP and the evolution of their voice"
            - "Produces auditable proof of contribution at the paragraph level"

        Exhibit image:
            /marketing/pen-over-paper-slope.png
        Caption:
            "Authorship is judgment, revision, and intent."

    E) Section: The Experiment (split text + system flow panel)
        Headline:
            "The experiment: a controlled pilot with five authors"

        Text points:
            - "This is not open enrollment."
            - "Five authors and their publishers co-author the EULA that governs the system."
            - "Each author writes their next long-form project inside the agent."

        Numbered list:
            1) "Compare full multi-chat project history to the final manuscript"
            2) "Detect ownership, authorship, and critical thinking across every paragraph"
            3) "Refine an operational model of AI-assisted authorship"
            4) "Improve the agent’s long-form support and governance"

        Closing line:
            "Authors retain full IP, including the evolution of their AI-assisted writing method."

        System Flow panel (right column):
            Bordered rounded panel (bg-background border border-border rounded-2xl p-6)
            containing a vertical flow:

                Author ↔ Writing Agent
                ↓
                Full Multi-Chat Archive
                ↓
                Authorship Detection Layer
                ↓
                Final Manuscript
                ↺
                Feedback Loop (Agent Improvement)

        Optional supporting image beneath panel (desktop only):
            /marketing/typewriter-text-collage.png
        Caption:
            "Dialogue becomes evidence."

    F) Section: Governance / EULA (text-forward + callout)

        Headline:
            "Governance: the EULA must be co-authored before the pilot can run"

        Copy:
            - "This project will not operate under a generic click-through agreement."
            - "Participating authors and publishers co-author the EULA to define:"
                - "IP ownership and reuse boundaries"
                - "Permitted research use of dialogue history"
                - "Limits on training, retention, and sharing"
                - "Auditability and dispute resolution"

        Callout (required):

            bg-background border border-border rounded-2xl p-6

            Title: "Non-negotiable baseline"
            Lines:
                - "Authors own their IP."
                - "Underlying data is used only to measure authorship, improve the agent, and advance Perspective Economics research."
                - "No third-party model training on partner manuscripts."

    G) Section: Research Basis
        Headline:
            "Grounded in Perspective Economics"
        Copy:
            "This pilot operationalizes the framework described in the academic paper:"

        Citation block (border-l pl-4, text-muted-foreground):
            "Perspective Economics: A Post-AI Model for Human Proof of Work through a Self-Moderating Marketplace of Dialogue"
        Button:
            "Read the Research Paper" (external link new tab)
        Supporting image:
            /marketing/writers-guild-noir.png
        Caption:
            "A guild implies standards."

    H) Section: Participation
        Headline:
            "Participation: seeking five authors and their publishers"

        Bullets:
            - "A professional publishing relationship"
            - "Willingness to co-author the governing EULA"
            - "Commitment to writing a full-length project inside the system"
            - "Comfort operating under structured research conditions"

        Note (text-muted-foreground):
            "Optional coaching is available on AI-assisted long-form workflow."

        CTA:
            "Request Participation Materials" → /signup

    I) Exhibit Gallery Strip (optional but recommended)
        Purpose:
            Use remaining images as restrained “exhibits” with captions.

        Grid:
            - Desktop: 3 columns
            - Mobile: 1 column

        Items:
            - /marketing/writer-desk-chaos.png               Caption: "Real work is messy."
            - /marketing/writer-procrastination-paint.png   Caption: "Thinking is part of writing."
            - /marketing/typewriter-text-collage.png        Caption: "Language leaves a trail."

Implementation Rules (Required)
    1) Use next/image for all images.
        - Provide width/height
        - Use sizes prop

    2) Use tokens/utilities only.
        - Prefer: bg-surface, bg-background, text-foreground, text-muted-foreground, border-border
        - Do NOT introduce inline hex colors or style= overrides.

    3) Keep existing /login and /signup navigation intact.
        - Do not rename routes.
        - Do not add intermediate routes.
        - Do not add query params.

    4) Buttons and links:
        - If Button component is already available and convenient, use it.
        - Otherwise style <Link> tags with token classes.
        - Do NOT create new shared component files for this patch.

    5) External paper link:
        Must open in new tab with rel="noreferrer noopener".

Non-Changes
    - No changes to any authenticated /app experience.
    - No changes to header/footer in app/app/layout.tsx.
    - No changes to auth flows or Stripe flows.
    - No changes to middleware, DB, or server actions.

Acceptance Criteria
    - "/" displays:
        - Top nav with logo/title left and Research Paper + Log in + Sign up on the top-right (ever-present).
        - Hero section with institutional messaging and a primary CTA that still routes to /signup.
        - All sections render with clean spacing and consistent typography.
        - At least 4 of the 6 curated images are present, served from /public/marketing/* via next/image.
        - Mobile layout stacks cleanly, no horizontal scroll.

    - Most important:
        - Log in still goes to /login.
        - Sign up still goes to /signup.
        - No functional regressions anywhere else.

Architectural Intent
    This root page is the institutional front door for a controlled pilot.
    It should signal rigor, governance, and evidentiary intent,
    while preserving all existing application functionality.

## Patch 4.04 — Root Page Corrections: CTA Routing, Diagram Logic, Image Narrative, Newspaper Flow

Goal

    Fix the root ("/") marketing page so it communicates the pilot accurately, reads as a cohesive
    top-to-bottom “newspaper-style” narrative, and uses images in a deliberate scan-friendly sequence.

    Specifically:
        1) Correct the primary CTA: "Request Participation Materials" must NOT route to /signup.
           It must route externally to MigVox.com Contact:
               https://migvox.com/migvox-home/contact/

        2) Correct the workflow diagram to match the actual system logic:
           - Author + Writing Agent produce TWO artifacts:
               a) Final Manuscript
               b) Full Multi-Chat Archive
           - Those two are combined by an Authorship Detection Layer (tool) to output THREE outcomes:
               1) Proof of Authorship
               2) Improved Authorship Detection Layer
               3) Writing Agent Improvement

        3) Make images and captions flow as a standalone vertical “scan script” (image-first comprehension),
           not a haphazard collage.

        4) Reduce excessive vertical pushing from the diagram and keep the layout tight and readable.

        5) Adjust copy tone so each block clearly connects to the previous block and the whole reads
           as one continuous argument: Lead → Critical Details → Extra Details.

        6) Reflect project status accurately:
           - The project is currently recruiting partners (authors + publishers).
           - The app experience is presently “text-only” / utilitarian for login/signup/subscribe.
           - The page will later be updated once the official test begins.

Scope (Strict)

    This patch applies only to:

        - app/page.tsx

    Do NOT modify:
        - Any /app/* authenticated routes
        - app/app/layout.tsx
        - /login or /signup pages
        - Auth logic (Supabase)
        - Stripe logic
        - Middleware
        - Server Actions
        - Database
        - Any other files

Non-Negotiable Guardrails (Required)

    1) No behavior changes to existing app flows.
        - Login must still go to /login.
        - Signup must still go to /signup.
        - Do not change auth/Stripe/middleware behavior.

    2) Only refactor layout + copy + image placement on "/".
        - You may re-style and reposition elements on the root page.
        - You may update text content.
        - You may change the destination of the NEW marketing CTA only.

    3) No new dependencies.

Required Corrections

A) Primary CTA Routing (Critical)

    Replace all instances of the “Request Participation Materials” CTA behavior so it links to:

        https://migvox.com/migvox-home/contact/

    Requirements:
        - Must open in a new tab (target="_blank") with rel="noreferrer noopener".
        - Must NOT navigate to /signup.
        - The ever-present Signup button in the top-right nav must remain and still go to /signup.

    Secondary CTA:
        “Read the Research Paper” remains external (new tab).

B) Add a Status Banner (Top-of-Page, directly under nav)

    Insert a small, high-clarity status band that sets expectations:

        Label: "Status"
        Message (tight):
            "Recruiting 5 author–publisher partners. The pilot has not started yet. The app is currently text-only while governance is finalized."

    Styling:
        - bg-background border border-border
        - rounded-xl
        - small type (text-sm), text-muted-foreground for most, with one bold phrase for “Recruiting…”

    This banner must be visible without scrolling on desktop (in normal viewport).

C) Rewrite the Workflow Diagram (Correct Logic + Less Vertical Push)

    Replace the current vertical “Author ↔ Writing Agent → …” flow with a compact diagram that does NOT
    push content downward excessively.

    Required diagram content (must match exactly in meaning):

        Top row (two boxes, side by side on desktop; stacked on mobile):
            - "Author"
            - "Writing Agent"

        Middle row (two outputs, side by side):
            - "Final Manuscript"
            - "Full Multi-Chat Archive"

        Combine row (single box centered):
            - "Authorship Detection Layer"

        Bottom row (three outputs; 3-column on desktop, stacked on mobile):
            - "Proof of Authorship"
            - "Improved Detection Layer"
            - "Writing Agent Improvement"

    Layout and spacing requirements:
        - Use a grid-based “boxes” diagram, not a tall arrow list.
        - Use minimal arrows (↓) between rows, but avoid repeating arrows between every box.
        - Keep the whole diagram inside a bordered rounded panel with tight padding (p-4 or p-5).
        - The diagram must be visually smaller than the hero image block.

    Title for diagram panel:
        "What the system measures"

    Subcaption (small, muted):
        "Outputs become evidence. Evidence improves the tools."

D) Image Narrative Re-Ordering (Scan Script)

    Reorder images and captions so a scanner can understand the story by images alone.

    Required image placements and captions:

    1) Hero image (right of hero copy):
        Image: /marketing/gavel-glitch.png
        Caption: "The legal problem AI created."

    2) Problem section exhibit:
        Image: /marketing/pen-over-paper-slope.png
        Caption: "Authorship is judgment, revision, and intent."

    3) Experiment section supporting exhibit (paired with diagram, but MUST NOT be shoved far down):
        Image: /marketing/typewriter-text-collage.png
        Caption: "Dialogue becomes an audit trail."

        Placement rule:
            - Place this image either ABOVE the diagram panel (preferred) or as a small side image
              within the experiment split column.
            - Do NOT place it far below the diagram.

    4) Research basis section image:
        Image: /marketing/writers-guild-noir.png
        Caption: "A guild implies standards."

    5) Bottom exhibit gallery (keep to 2 images, not 3, to reduce noise):
        Use ONLY:
            - /marketing/writer-desk-chaos.png  Caption: "Real work is messy."
            - /marketing/writer-procrastination-paint.png  Caption: "Thinking is part of writing."

        Remove typewriter-text-collage.png from the bottom gallery since it is used earlier as the
        diagram companion.

    Consistency requirements:
        - All captions must use the same style: text-xs text-muted-foreground mt-2
        - All image containers must use: rounded-2xl border border-border overflow-hidden
        - No random caption tone shifts. Keep them declarative and spare.

E) Copy Tone and Cohesion (Newspaper Flow)

    Rewrite copy so each section leads naturally into the next:

    1) Hero (Lead)
        Headline stays.
        Subheadline must be tightened and must mention both authors AND publishers explicitly.
        Add one line that tees up the rest of the page (bridge sentence), e.g.:
            "The sections below explain the problem, the method, and the governance required before the test begins."

    2) Problem (Critical details)
        Reduce bullet count if needed, but keep the core four.
        Ensure it ends with a forward pointer sentence:
            "So the pilot focuses on evidence, not claims."

    3) Experiment (Method)
        Must clearly state:
            - What artifacts are produced (manuscript + multi-chat archive)
            - What the detection layer does (compare them)
            - What outputs come out (proof + improved tools)

        End with:
            "This is why the EULA comes first."

    4) Governance / EULA (Constraints)
        Keep the non-negotiable callout, but tighten the language so it reads like policy not marketing.

    5) Research basis (Credibility)
        Must read like citation and positioning, not hype.

    6) Participation (Action)
        Must clearly state this is recruitment stage and the pilot is not live yet.
        CTA must point to the contact page.

F) Buttons and Nav Behavior (Explicit)

    Root nav (top-right) must remain:

        Research Paper (external)
        Log in (internal /login)
        Sign up (internal /signup)

    Requirements:
        - These must be ever-present on "/".
        - Do NOT remove or hide them at any breakpoint.
        - “Sign up” remains an outlined button (secondary).
        - “Log in” remains a text link.

    Marketing CTAs within the page:
        - “Request Participation Materials” must link to the MigVox contact page (external).
        - Do NOT add any new internal routes.

Implementation Rules (Required)

    1) Keep changes isolated to app/page.tsx.
        - No edits elsewhere.

    2) Use next/image everywhere with width/height and sizes.

    3) No inline hex colors. Use tokens:
        bg-surface, bg-background, text-foreground, text-muted-foreground, border-border.

    4) Reduce excessive vertical whitespace:
        - Keep section spacing consistent, but tighten places where the diagram currently causes large gaps.
        - Prefer gap-6 / gap-8 in grids, not gap-12 unless needed.

Acceptance Criteria

    - Primary CTA “Request Participation Materials” opens:
          https://migvox.com/migvox-home/contact/
      in a new tab, and nowhere routes to /signup.

    - Login and Signup remain ever-present in the top-right nav and still route to /login and /signup.

    - The workflow diagram matches the corrected logic:
        Inputs: Author + Writing Agent
        Artifacts: Final Manuscript + Full Multi-Chat Archive
        Tool: Authorship Detection Layer
        Outputs: Proof of Authorship + Improved Detection Layer + Writing Agent Improvement

    - Images and captions read coherently in vertical scan order and are consistently styled.

    - The page reads as one cohesive narrative with a newspaper-like flow.

    - No regressions in any other app functionality.

Architectural Intent

    The root page is a recruiting and governance briefing document disguised as a landing page.
    It must privilege accuracy, continuity, and evidentiary framing over “conversion” aesthetics.

## Patch 4.05 — Reframe Root (/) as App Transition Portal (Recruiting Stage + Preservation Rules)

Goal

    Radically simplify and repurpose the root page ("/") so it functions as:

        - A transition point between MigVox.com (public marketing site)
          and the MigVox for Authors application (controlled environment).
        - A status-aware access portal for prospective partner Authors and Publishers.
        - A credibility reinforcement layer that implies institutional viability
          without duplicating marketing content.

    The root page must NO LONGER function as a marketing narrative page.
    All extended persuasion, diagrams, and detailed explanation must be removed.

    Status reality (must be reflected accurately):

        - The project is currently recruiting professional Authors and their Publishers.
        - The EULA does not exist yet in final form.
        - The EULA will be co-authored with selected partners after onboarding.
        - The pilot cannot begin until the partner co-authored EULA is finalized.

Scope (Strict)

    This patch applies ONLY to:

        - app/page.tsx

    Do NOT modify:
        - app/app/layout.tsx
        - Any /app/* authenticated routes
        - /login or /signup pages (logic or behavior)
        - Auth flows (Supabase)
        - Stripe logic
        - Middleware
        - Server Actions
        - Database
        - Shared UI component files (app/_components/ui/*), unless already imported by app/page.tsx

Non-Negotiable Guardrails (Critical)

    1) No functionality changes.
        - "Log in" must still route to /login.
        - "Sign up" must still route to /signup.
        - Do not change redirects, auth checks, middleware, or Stripe behavior.

    2) Preserve two existing behaviors on the root page (Required):

        A) Logged-in redirect behavior:
            - If the user is already authenticated, the root page MUST continue to redirect to:
                /app

            - This must remain implemented using existing project patterns (e.g. getCurrentUser()).
            - Do NOT remove or bypass this behavior.

        B) Account deletion banner behavior:
            - The existing searchParams/message banner behavior MUST remain:
                ?message=account-deleted

            - Whatever UI currently shows that message must continue to show it.
            - The delete-account flow depends on this behavior.

    3) External link constraint:
        - The only new external link allowed on "/" is:
            "Back to MigVox.com"
            → https://migvox.com/migvox-home/current-experiment/migvox-for-authors/

    4) No marketing images, diagrams, or galleries remain on the root page.

    5) The page must fit within a single viewport height on desktop (no long scroll).

Naming Consistency (Required)

    The application name is already established in the authenticated shell (app/app/layout.tsx) as:

        "MigVox for Authors"

    Therefore:
        - Use "MigVox for Authors" everywhere on "/" for consistency.
        - Do NOT introduce "MigVox for Writers" on "/" in this patch.

Layout Specification (Required)

    A) Top Navigation (Within app/page.tsx Only)

        Purpose:
            Provide a visible transition spine between the marketing site and the app,
            while keeping access actions ever-present.

        Structure:

            Left:
                Logo (if already available) + "MigVox for Authors"

            Center (Required):
                Text link:
                    "Back to MigVox.com"
                URL:
                    https://migvox.com/migvox-home/current-experiment/migvox-for-authors/

                Behavior:
                    - Open in SAME tab.
                    - Styled as a text link (no button styling).
                    - Slightly muted (text-muted-foreground).
                    - Hover underline.

            Right (Required, ever-present):
                "Log in" → /login  (text link)
                "Sign up" → /signup (outlined button)

        Mobile constraint:
            - Do NOT hide any of these at any breakpoint.
            - You may reduce font size, tighten spacing, or allow wrapping.
            - Do NOT collapse into a hamburger menu in this patch.

    B) Core Content Area (Centered, Constrained)

        Container:
            - max-w-3xl
            - centered
            - generous vertical padding (py-20 to py-24 desktop)
            - bg-surface text-foreground

        Note:
            Keep content compact enough to fit one viewport.

    C) Headline Block (Minimal)

        Headline:
            "MigVox for Authors"

        Subheading (Corrected, neutral, non-marketing):

            "Partner Portal for AI-Assisted Authorship"

        Short description (1–2 sentences max):

            This application supports a controlled pilot for professional authors and their publishers.
            The goal is to establish a defensible model of authorship when an AI is involved.

        Tone:
            - Formal
            - Restrained
            - No hype language
            - No exclamation marks

    D) Current Status Panel (Required, recruitment-stage accurate)

        Bordered panel (rounded-xl border border-border bg-background p-6)

        Title:
            "Current Project Status"

        Body (must be corrected, typo-free, and coherent):

            The pilot has not yet begun.
            Currently recruiting five professional authors and their publishers.
            The EULA will be co-authored with selected partners before launch.

        Optional small muted line:

            The application interface is currently operational in test-only mode.

        Visual requirements:
            - Emphasize the recruitment line visually (weight or color via tokens).
            - Keep the rest muted and calm.

    E) Access Actions (Primary Interaction)

        Centered action row beneath the status panel:

            Primary:
                "Sign up" → /signup

            Secondary:
                "Log in" → /login

        Below that (small muted text):

            Partner enrollment is reviewed prior to pilot activation.

        IMPORTANT:
            - Do NOT change routes or introduce new ones.
            - These actions must remain exactly /signup and /login.

    F) Preserve Root Message Banner (Account Deleted)

        Keep the existing behavior that displays a banner/message when:

            ?message=account-deleted

        The banner may be re-styled to match the new minimal layout, but:
            - It must remain visible.
            - It must remain triggered by the same query param value.
            - It must not break the account deletion flow.

    G) Bottom Reinforcement Link (Required)

        After a subtle divider line:

            Text link:
                "Back to the MigVox experiment overview →"

            URL:
                https://migvox.com/migvox-home/current-experiment/migvox-for-authors/

            Behavior:
                - Same tab navigation.
                - Muted text, smaller than body.

Removed Elements (Explicit)

    Remove entirely from "/" in this patch:

        - All marketing images
        - All workflow diagrams
        - Galleries
        - Long-form experiment explanation
        - Governance callout blocks
        - Research citation section
        - Any CTA routing to contact page
        - Any multi-section landing-page structure

    "/" becomes a portal, not a brochure.

Design Tone Requirements

    - No dramatic imagery.
    - No heavy shadows.
    - No oversized saturated CTAs.
    - No visual clutter.
    - Strong typographic hierarchy, minimal elements.
    - Token-based colors only:
        bg-surface, bg-background, text-foreground, text-muted-foreground, border-border

Implementation Rules (Required)

    1) Keep all changes inside app/page.tsx.
    2) Drop unused imports (e.g., next/image) if images are removed.
    3) Use existing Button component if already used; otherwise style links minimally.
    4) No new dependencies.
    5) Preserve redirect and message behaviors as specified above.

Acceptance Criteria

    - "/" renders a compact portal UI (no long scroll) with:
        - Top nav: Left branding, Center "Back to MigVox.com" link, Right Login + Signup
        - Minimal headline + 1–2 sentence description
        - Status panel with recruitment + EULA sequencing correct
        - Login and Signup actions
        - Bottom "Back to the MigVox experiment overview" link

    - Logged-in users are still redirected to /app.
    - ?message=account-deleted banner still appears and works.
    - Login and Signup still route to /login and /signup.
    - No regressions anywhere else.

Outcome

    The root page becomes a credible, minimal, status-aware transition portal
    that implies the app’s purpose is explained on MigVox.com,
    while preserving all existing app functionality and flows.

## Patch 4.06 — System-Wide “Test-Only Mode” Alert Banner (No Destructive Token)

Goal

    Implement a consistent, system-wide “test-only mode” alert that appears at the top of the
    content well across the entire application experience:

        - /
        - /login
        - /signup
        - /app and all /app/* pages

    The alert must be visually unmistakable:

        - Red bordered
        - Rounded box
        - Compact
        - Placed at the top of each page’s content well (not inside the header)

    IMPORTANT:
        Avoid double-rendering on /app routes. Do NOT use app/layout.tsx to render the alert.

Rationale (Structural Constraint)

    app/layout.tsx wraps all routes including /app/*, and app/app/layout.tsx wraps /app/* as well.
    Therefore, placing the alert in app/layout.tsx will necessarily cause double-render on /app pages.

    To achieve true system-wide coverage without route restructuring or pathname-based client checks,
    the alert must be rendered in:

        - app/app/layout.tsx   (covers /app/*)
        - app/page.tsx         (covers /)
        - app/login/page.tsx   (covers /login)
        - app/signup/page.tsx  (covers /signup)

Scope (Strict)

    Files permitted to change:

        - app/app/layout.tsx
        - app/page.tsx
        - app/login/page.tsx
        - app/signup/page.tsx
        - app/_components/SystemStatusAlert.tsx   (new, shared UI-only component)

    Do NOT modify:
        - app/layout.tsx
        - globals.css (not required for this patch)
        - Auth logic
        - Stripe logic
        - Middleware
        - Server Actions
        - Database
        - Route structure (no route groups)
        - Any redirect logic (including root redirect to /app for authenticated users)
        - Any query-param behaviors (including ?message=account-deleted on root)

Non-Negotiable Guardrails

    1) Visual-only change.
        This patch must not change any behavior, navigation, or app logic.

    2) Preserve existing root behaviors.
        - Logged-in redirect to /app must remain unchanged.
        - The ?message=account-deleted banner must remain unchanged (may be repositioned only if needed
          to keep the new status alert above it, but its triggering logic and text must remain).

    3) No new dependencies.
    4) No client pathname checks.
        - Do not use usePathname(), useRouter(), or any client-only gating for this banner.

Alert Design Requirements (Required)

    Copy (exact):

        "Status: This application is in test-only mode."

    Visual styling:

        This project does NOT define shadcn "destructive" tokens.
        Therefore this patch MUST use standard Tailwind red utilities directly
        (no token additions, no globals.css changes):

            - rounded-xl
            - border
            - border-red-500/60
            - bg-red-500/10
            - text-red-700 (or text-red-600 if contrast is better against bg-red-500/10)
            - px-4 py-3
            - text-sm
            - leading-snug

    Placement:
        - At the top of the page content well, below any nav/header and above the page’s main content.
        - Must not appear inside the header/nav elements.

Shared Component (Required)

    Create:

        app/_components/SystemStatusAlert.tsx

    Requirements:
        - Server-safe (no "use client")
        - No hooks
        - No props required
        - Always renders the alert (system is currently in test-only mode)

    Component output:
        - A wrapper div with the required styling
        - The exact status text inside

Implementation Rules (By Page)

    A) /app/* coverage (Required)

        In app/app/layout.tsx:

            - Import SystemStatusAlert
            - Render it once inside the <main> content well:
                - After the /app header
                - Before {children}

            Ensure it aligns with the existing content width constraints used by /app pages.

    B) / coverage (Required)

        In app/page.tsx:

            - Import SystemStatusAlert
            - Render it at the top of the root content well, below the root nav and above the rest of root content.

            IMPORTANT PRESERVATIONS:
                - Keep logged-in redirect behavior (getCurrentUser() + redirect("/app")) unchanged.
                - Keep ?message=account-deleted behavior unchanged.
                - If both the status alert and the account-deleted banner appear, the status alert must appear first.

    C) /login coverage (Required)

        In app/login/page.tsx:

            - Import SystemStatusAlert
            - Render it at the top of the login content well, above the login form/card.

            Do NOT change:
                - Form behavior
                - Redirect behavior
                - Query param messaging behavior (if any)

    D) /signup coverage (Required)

        In app/signup/page.tsx:

            - Import SystemStatusAlert
            - Render it at the top of the signup content well, above the signup form/card.

            Do NOT change:
                - Form behavior
                - Redirect behavior
                - Query param messaging behavior (if any)

Duplication Rules (Required)

    - The alert must render exactly once per route:
        - Exactly once on /app/*
        - Exactly once on /
        - Exactly once on /login
        - Exactly once on /signup

    - app/layout.tsx must not render the alert.

Non-Changes

    - No changes to login/signup flow, validation, or error messaging.
    - No changes to auth redirect logic anywhere.
    - No changes to /app header/footer.
    - No changes to MigVox.com links.
    - No changes to any Stripe behavior.

Acceptance Criteria

    - The alert appears on:
        - /
        - /login
        - /signup
        - /app and all /app/* pages

    - The alert text matches exactly:
        "Status: This application is in test-only mode."

    - The alert is red bordered, rounded, and placed at the top of the content well.

    - The alert does NOT double-render on /app routes.

    - All existing behaviors remain unchanged, including:
        - Root logged-in redirect to /app
        - Root ?message=account-deleted banner

Outcome

    The system presents a single consistent test-mode status banner everywhere users can enter or operate,
    without route restructuring, without client pathname checks, and without introducing missing theme tokens.

