Supporting Module – Design Basics
Source: www.migvox.com

Suggested Tailwindcss Settings: 
The idea is to replace the existing globals.css with this: 
Begin File: 



@import "tailwindcss";

/* =======================================================
   MIGVOX TOKENS (raw values)
   - Use private-prefixed variables here
   - Map them into Tailwind tokens in @theme inline
======================================================= */
:root {
  /* Colors */
  --_bg: #ffffff;
  --_fg: #1c1c1c;
  --_surface: #f7f7f7;

  --_accent: #ff5e3a;
  --_accent-alt: #8a4fff;

  --_danger: #ff3427;

  --_support-blue: #227bc3;
  --_support-pink: #e44993;
  --_support-purple: #9463ae;

  --_card-border: #cccccc;
  --_tooltip-bg: #333333;

  /* Radius */
  --_radius-card: 28px;
  --_radius-btn: 3px;
  --_radius-input: 10px; /* inferred: softer than buttons */

  /* Shadow */
  --_shadow-card: 0 0 2px rgba(0, 0, 0, 0.15);

  /* Layout */
  --_container: 1170px;

  /* Fonts (names only; actual loading must be handled in app/layout.tsx) */
  --_font-heading: "Noto Serif Display";
  --_font-body: "Noto Sans Display";
  --_font-nav: "Merriweather";
  --_font-fallback: "Open Sans", "Roboto", Arial, Helvetica, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --_bg: #0d1117;
    --_fg: #ffffff;
    --_surface: #0a0f14;

    /* Keep accent stable */
    --_card-border: rgba(255, 255, 255, 0.18);
    --_shadow-card: 0 0 2px rgba(0, 0, 0, 0.35);
  }
}

/* =======================================================
   TAILWIND v4 THEME TOKENS
   This is the equivalent of theme.extend in v3.
======================================================= */
@theme inline {
  /* Colors */
  --color-background: var(--_bg);
  --color-foreground: var(--_fg);
  --color-surface: var(--_surface);

  --color-accent: var(--_accent);
  --color-accent-alt: var(--_accent-alt);

  --color-danger: var(--_danger);

  --color-support-blue: var(--_support-blue);
  --color-support-pink: var(--_support-pink);
  --color-support-purple: var(--_support-purple);

  --color-card-border: var(--_card-border);
  --color-tooltip: var(--_tooltip-bg);

  /* Fonts */
  --font-heading: var(--_font-heading), var(--_font-fallback);
  --font-sans: var(--_font-body), var(--_font-fallback);
  --font-nav: var(--_font-nav), var(--_font-fallback);

  /* Radius */
  --radius-card: var(--_radius-card);
  --radius-btn: var(--_radius-btn);
  --radius-input: var(--_radius-input);

  /* Shadow */
  --shadow-card: var(--_shadow-card);

  /* Sizing */
  --max-width-container: var(--_container);
}

/* =======================================================
   BASE ELEMENT STYLES
======================================================= */
html,
body {
  height: 100%;
}

body {
  background: var(--_bg);
  color: var(--_fg);
  font-family: var(--_font-body), var(--_font-fallback);
  line-height: 1.7;
}

/* Editorial heading weight */
h1, h2 {
  font-family: var(--_font-heading), var(--_font-fallback);
  letter-spacing: 0;
}

h1 { line-height: 1.1; }
h2 { line-height: 1.2; }

End File: 

Post Implementation of new version into globals.css remaining Action Items 

    Implementation action item (this should be prominent in your module doc, not buried):

        Font loading (required)
        You must load:

        Noto Serif Display

        Noto Sans Display

        Merriweather

    via next/font/google in app/layout.tsx (or equivalent), otherwise the CSS will fall back to Open Sans/Roboto/Arial and you’ll wonder why nothing matches Migvox.

    One more thing you didn’t mention but will bite later:
    Your app currently sets --font-sans: var(--font-geist-sans) in @theme. If you adopt Migvox fonts, you should remove the Geist mapping or explicitly decide Geist stays. Mixing Geist + Noto + Merriweather is a fast track to “why does this look slightly off everywhere?”