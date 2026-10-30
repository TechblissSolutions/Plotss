import type { Paint, ThemeSettings } from "./types";

const solid = (color: string): Paint => ({ mode: "solid", color, to: color, angle: 135 });

export const DEFAULT_THEME: ThemeSettings = {
  colors: {
    // "Cinematic Navy + Signal Orange" — midnight navy for dark surfaces, signal orange for CTAs,
    // warm soft ivory for content pages. Deep ocean blue replaces the old royal blue for trust signals.
    graphite: solid("#071D33"),   // Midnight Navy — text, dark sections, footer
    // CTA gradient: Signal Orange (vibrant, high contrast on white or dark) — white text clears WCAG AA.
    clay: { mode: "gradient", color: "#FF850B", to: "#E66D00", angle: 135 },
    // Deep Ocean Blue for trust/info — eyebrow tags, auth panel, secondary dark sections.
    trust: solid("#103D63"),
    ivory: solid("#F6F4EF"),      // Soft warm ivory — warmer than neutral white, premium feel
    signal: solid("#C8FF4D"),     // AI brand accent — keeps its role as "AI-generated" marker
    stone: solid("#697B8C"),      // Muted text on light bg
    moss: solid("#3D5A40"),
    line: solid("#D9E5ED"),       // Blue-tinted border/divider — matches the navy system
  },
  typography: {
    headingFont: "Manrope",       // Premium geometric sans — confident, modern, pairs with Inter
    bodyFont: "Inter",
    dataFont: "Inter Tight",
    headingWeight: 700,           // Manrope 700 — strong, clean display weight
    bodyWeight: 400,
    baseSize: 16,
    bodyLineHeight: 1.6,
    headingLineHeight: 1.1,
    headingTracking: -0.025,      // Slightly tighter than before — Manrope reads well at this level
    scaleRatio: 1.25,
  },
  ui: {
    radius: 14,
    borderWidth: 1,
    containerWidth: 1240,
    sectionSpacing: 96,
    shadow: "soft",
  },
};

/** Curated Google Fonts the super admin can pick from (name -> fallback stack + axis spec). */
export const FONT_OPTIONS: Record<string, { stack: string; axis: string }> = {
  Fraunces: { stack: "serif", axis: "opsz,wght@9..144,300..900" },
  "Playfair Display": { stack: "serif", axis: "wght@400..900" },
  "DM Serif Display": { stack: "serif", axis: "wght@400" },
  Lora: { stack: "serif", axis: "wght@400..700" },
  Inter: { stack: "sans-serif", axis: "wght@300..800" },
  "Inter Tight": { stack: "sans-serif", axis: "wght@300..800" },
  "DM Sans": { stack: "sans-serif", axis: "wght@300..800" },
  Manrope: { stack: "sans-serif", axis: "wght@300..800" },
  "Plus Jakarta Sans": { stack: "sans-serif", axis: "wght@300..800" },
  Poppins: { stack: "sans-serif", axis: "wght@300;400;500;600;700" },
  "Space Grotesk": { stack: "sans-serif", axis: "wght@300..700" },
  "IBM Plex Sans": { stack: "sans-serif", axis: "wght@300;400;500;600;700" },
};
