import type { Paint, ThemeSettings } from "./types";

const solid = (color: string): Paint => ({ mode: "solid", color, to: color, angle: 135 });

export const DEFAULT_THEME: ThemeSettings = {
  colors: {
    // "Professional Blue + Amber" — white/near-white page, deep blue for trust/info, amber gradient for
    // CTAs. graphite is cooler (slate-900) than before so it pairs with blue instead of the old warm ink.
    graphite: solid("#0F172A"),
    // CTA gradient: amber-700 -> amber-800 (NOT the brighter amber-500/600) specifically so white button
    // text stays readable — --c-clay (text/borders, e.g. price tags) is the solid amber-700 start, which
    // alone already clears WCAG AA against white; --f-clay (button fills, via paint-clay) is the gradient.
    clay: { mode: "gradient", color: "#B45309", to: "#92400E", angle: 135 },
    // Primary trust/info accent — eyebrow tags, auth panel, institutional signals. Real-estate's most
    // common "this platform is trustworthy" color (Housing.com, 99acres, NoBroker all use blue here).
    trust: solid("#1E3A8A"),
    ivory: solid("#F8FAFC"),
    signal: solid("#C8FF4D"),
    stone: solid("#64748B"),
    moss: solid("#3D5A40"),
    line: solid("#E2E8F0"),
  },
  typography: {
    headingFont: "Fraunces",
    bodyFont: "Inter",
    dataFont: "Inter Tight",
    headingWeight: 500,
    bodyWeight: 400,
    baseSize: 16,
    bodyLineHeight: 1.6,
    headingLineHeight: 1.1,
    headingTracking: -0.02,
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
