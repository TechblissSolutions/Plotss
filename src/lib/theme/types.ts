export const COLOR_KEYS = ["graphite", "clay", "trust", "ivory", "signal", "stone", "moss", "line"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export type Paint = {
  mode: "solid" | "gradient";
  color: string;
  /** gradient end colour (used when mode = gradient) */
  to: string;
  /** gradient angle in degrees */
  angle: number;
};

export type ThemeSettings = {
  colors: Record<ColorKey, Paint>;
  typography: {
    headingFont: string;
    bodyFont: string;
    dataFont: string;
    headingWeight: number;
    bodyWeight: number;
    /** base font size in px */
    baseSize: number;
    bodyLineHeight: number;
    headingLineHeight: number;
    /** heading letter-spacing in em */
    headingTracking: number;
    /** modular type-scale ratio */
    scaleRatio: number;
  };
  ui: {
    /** base corner radius in px */
    radius: number;
    borderWidth: number;
    /** max content width in px */
    containerWidth: number;
    /** vertical section padding in px */
    sectionSpacing: number;
    shadow: "none" | "soft";
  };
};

export const COLOR_LABELS: Record<ColorKey, { label: string; hint: string }> = {
  graphite: { label: "Graphite", hint: "Primary / text / dark surfaces" },
  clay: { label: "Clay", hint: "Primary accent, CTA buttons" },
  trust: { label: "Trust", hint: "Professional accent — eyebrow tags, auth panel, institutional signals" },
  ivory: { label: "Ivory", hint: "Page background" },
  signal: { label: "Signal", hint: "AI tags, match scores only" },
  stone: { label: "Stone", hint: "Muted text" },
  moss: { label: "Moss", hint: "Verified / success" },
  line: { label: "Line", hint: "Borders & dividers" },
};
