import { DEFAULT_THEME, FONT_OPTIONS } from "./defaults";
import { COLOR_KEYS, type Paint, type ThemeSettings } from "./types";

const HEX = /^#[0-9a-fA-F]{6}$/;
const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};

/** Merge saved JSON over defaults and sanitise every value (settings come from the DB / a form). */
export function normalizeTheme(raw: unknown): ThemeSettings {
  const r = (raw ?? {}) as Partial<ThemeSettings>;
  const d = DEFAULT_THEME;

  const colors = {} as ThemeSettings["colors"];
  for (const key of COLOR_KEYS) {
    const p = (r.colors?.[key] ?? {}) as Partial<Paint>;
    const base = d.colors[key];
    const color = HEX.test(p.color ?? "") ? p.color! : base.color;
    colors[key] = {
      mode: p.mode === "gradient" ? "gradient" : "solid",
      color,
      to: HEX.test(p.to ?? "") ? p.to! : color,
      angle: clamp(p.angle, 0, 360, base.angle),
    };
  }

  const t = (r.typography ?? {}) as Partial<ThemeSettings["typography"]>;
  const font = (v: unknown, fb: string) => (typeof v === "string" && v in FONT_OPTIONS ? v : fb);
  const dt = d.typography;
  const typography: ThemeSettings["typography"] = {
    headingFont: font(t.headingFont, dt.headingFont),
    bodyFont: font(t.bodyFont, dt.bodyFont),
    dataFont: font(t.dataFont, dt.dataFont),
    headingWeight: clamp(t.headingWeight, 300, 900, dt.headingWeight),
    bodyWeight: clamp(t.bodyWeight, 300, 700, dt.bodyWeight),
    baseSize: clamp(t.baseSize, 13, 20, dt.baseSize),
    bodyLineHeight: clamp(t.bodyLineHeight, 1.2, 2.2, dt.bodyLineHeight),
    headingLineHeight: clamp(t.headingLineHeight, 0.9, 1.6, dt.headingLineHeight),
    headingTracking: clamp(t.headingTracking, -0.08, 0.1, dt.headingTracking),
    scaleRatio: clamp(t.scaleRatio, 1.1, 1.6, dt.scaleRatio),
  };

  const u = (r.ui ?? {}) as Partial<ThemeSettings["ui"]>;
  const du = d.ui;
  const ui: ThemeSettings["ui"] = {
    radius: clamp(u.radius, 0, 32, du.radius),
    borderWidth: clamp(u.borderWidth, 0, 4, du.borderWidth),
    containerWidth: clamp(u.containerWidth, 960, 1600, du.containerWidth),
    sectionSpacing: clamp(u.sectionSpacing, 32, 200, du.sectionSpacing),
    shadow: u.shadow === "soft" ? "soft" : "none",
  };

  return { colors, typography, ui };
}

const paintValue = (p: Paint) =>
  p.mode === "gradient" ? `linear-gradient(${p.angle}deg, ${p.color}, ${p.to})` : p.color;

const fontStack = (name: string) => `"${name}", ${FONT_OPTIONS[name]?.stack ?? "sans-serif"}`;

/** Google Fonts stylesheet URL for the fonts currently selected. */
export function fontsHref(theme: ThemeSettings): string {
  const { headingFont, bodyFont, dataFont } = theme.typography;
  const families = [...new Set([headingFont, bodyFont, dataFont])].map(
    (f) => `family=${f.replace(/ /g, "+")}:${FONT_OPTIONS[f].axis}`,
  );
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/** CSS custom properties for a theme, scoped to `selector` (":root" for the site, ".theme-preview" in the editor). */
export function buildThemeCss(theme: ThemeSettings, selector = ":root"): string {
  const { colors, typography: t, ui } = theme;
  const vars: string[] = [];

  for (const key of COLOR_KEYS) {
    vars.push(`--c-${key}:${colors[key].color}`); // solid: text / borders
    vars.push(`--f-${key}:${paintValue(colors[key])}`); // fill: solid or gradient
  }

  vars.push(
    `--t-font-heading:${fontStack(t.headingFont)}`,
    `--t-font-body:${fontStack(t.bodyFont)}`,
    `--t-font-data:${fontStack(t.dataFont)}`,
    `--t-weight-heading:${t.headingWeight}`,
    `--t-weight-body:${t.bodyWeight}`,
    `--t-base:${t.baseSize}px`,
    `--t-lh-body:${t.bodyLineHeight}`,
    `--t-lh-heading:${t.headingLineHeight}`,
    `--t-tracking-heading:${t.headingTracking}em`,
  );

  const step = (n: number) => `${+(t.scaleRatio ** n).toFixed(3)}rem`;
  vars.push(
    `--t-h6:${step(0)}`,
    `--t-h5:${step(1)}`,
    `--t-h4:${step(2)}`,
    `--t-h3:${step(3)}`,
    `--t-h2:${step(4)}`,
    `--t-h1:${step(5)}`,
    `--t-display:${step(7)}`,
  );

  vars.push(
    `--t-radius-sm:${Math.round(ui.radius * 0.6)}px`,
    `--t-radius:${ui.radius}px`,
    `--t-radius-lg:${Math.round(ui.radius * 1.6)}px`,
    `--t-border:${ui.borderWidth}px`,
    `--t-container:${ui.containerWidth}px`,
    `--t-section-y:${ui.sectionSpacing}px`,
    `--t-shadow:${ui.shadow === "soft" ? "0 8px 30px rgb(22 24 27 / 0.08)" : "none"}`,
  );

  return `${selector}{${vars.join(";")}}`;
}
