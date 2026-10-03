import { describe, expect, it } from "vitest";
import { parseQueryRules } from "../src/lib/search";
import { buildThemeCss, normalizeTheme } from "../src/lib/theme/css";

describe("parseQueryRules", () => {
  it("parses the headline example", () => {
    const f = parseQueryRules("3 acre industrial land near Ghaziabad under 2Cr");
    expect(f).toMatchObject({ city: "ghaziabad", category: "industrial", maxPrice: 2e7, targetAcres: 3 });
  });
  it("parses lakh, lease and zone", () => {
    const f = parseQueryRules("lease UPSIDC plot in Greater Noida below 50 lakh");
    expect(f).toMatchObject({ city: "noida", listing_type: "lease", zone: "UPSIDC", maxPrice: 5e6 });
  });
  it("returns nothing for gibberish", () => {
    expect(parseQueryRules("hello there")).toEqual({});
  });
});

describe("theme", () => {
  it("rejects bad hex and clamps numbers", () => {
    const t = normalizeTheme({ colors: { clay: { mode: "gradient", color: "red;}", to: "#000000", angle: 999 } }, typography: { baseSize: 500, headingFont: "Evil" } });
    expect(t.colors.clay.color).toBe("#B45309");
    expect(t.colors.clay.angle).toBe(360);
    expect(t.typography.baseSize).toBe(20);
    expect(t.typography.headingFont).toBe("Fraunces");
  });
  it("emits gradient fills", () => {
    const t = normalizeTheme({ colors: { clay: { mode: "gradient", color: "#111111", to: "#222222", angle: 90 } } });
    expect(buildThemeCss(t)).toContain("--f-clay:linear-gradient(90deg, #111111, #222222)");
  });
});
