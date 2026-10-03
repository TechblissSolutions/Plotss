import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { formatINR, maskName, maskPhone, toAcres } from "../src/lib/format";
import { Markdown } from "../src/lib/markdown";
import { rateLimit } from "../src/lib/rate-limit";
import { fillTemplate, jsonLd } from "../src/lib/seo";

describe("contact masking", () => {
  it("hides most of a name and number", () => {
    expect(maskName("Rajesh Sharma")).toMatch(/^R\*+ S\*+$/);
    expect(maskPhone("+919820012345")).toBe("+91 98***345");
  });
});

describe("formatting", () => {
  it("formats rupees in Cr / Lakh", () => {
    expect(formatINR(18500000)).toBe("₹1.85 Cr");
    expect(formatINR(750000)).toBe("₹7.5 Lakh");
  });
  it("converts areas to acres", () => {
    expect(toAcres(43560, "sqft")).toBeCloseTo(1, 5);
  });
});

describe("markdown renderer is XSS-safe", () => {
  it("escapes raw HTML and blocks javascript: links", () => {
    const html = renderToStaticMarkup(Markdown({ source: "<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n![i](javascript:alert(2))" }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("href=\"javascript:");
    expect(html).not.toContain("src=\"javascript:");
  });
  it("renders headings, lists and https links", () => {
    const html = renderToStaticMarkup(Markdown({ source: "## Title\n\n- one\n- two\n\n[site](https://example.com)" }));
    expect(html).toContain("<h3");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("href=\"https://example.com\"");
  });
});

describe("seo helpers", () => {
  it("fills title templates", () => {
    expect(fillTemplate("{title} — {city}", { title: "Plot", city: "Pune" })).toBe("Plot — Pune");
  });
  it("cannot break out of a JSON-LD script tag", () => {
    expect(jsonLd({ a: "</script><script>x" })).not.toContain("</script>");
  });
});

describe("rate limiter", () => {
  it("allows up to the limit then blocks", () => {
    const k = "test-" + Math.random();
    expect([1, 2, 3].map(() => rateLimit(k, 3, 60_000))).toEqual([true, true, true]);
    expect(rateLimit(k, 3, 60_000)).toBe(false);
  });
});
