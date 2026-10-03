import { describe, expect, it } from "vitest";
import { buildReport, type Ev } from "../src/lib/analytics/report";
import { cleanEvent, cleanProps, deviceFromUA } from "../src/lib/analytics/schema";
import { cleanFeatures, DEFAULT_FEATURES } from "../src/lib/features-shared";

let t = 0;
const ev = (sid: string, type: string, extra: Partial<Ev> = {}): Ev => ({
  at: new Date(Date.UTC(2026, 8, 21, 10, 0, t++)).toISOString(), vid: "v-" + sid, sid, user_id: null, type, path: "/", label: null,
  props: null, referrer: null, utm_source: null, device: "mobile", ...extra,
});

describe("event cleaning (privacy)", () => {
  it("rejects unknown event types and non-objects", () => {
    expect(cleanEvent({ type: "keylog" })).toBeNull();
    expect(cleanEvent("x")).toBeNull();
    expect(cleanEvent({ type: "click", label: "Unlock", path: "/listing/x?phone=999" })).toMatchObject({ type: "click", path: "/listing/x" });
  });
  it("keeps only small primitive props", () => {
    const p = cleanProps({ step: "details", n: 3, ok: true, nested: { a: 1 }, list: [1], long: "x".repeat(500), "bad key!": 1 });
    expect(p).toMatchObject({ step: "details", n: 3, ok: true });
    expect(p).not.toHaveProperty("nested");
    expect(p).not.toHaveProperty("list");
    expect((p.long as string).length).toBeLessThanOrEqual(80);
  });
  it("classifies devices", () => {
    expect(deviceFromUA("Mozilla/5.0 (iPhone; CPU iPhone OS 17)")).toBe("mobile");
    expect(deviceFromUA("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe("desktop");
  });
});

describe("journey report", () => {
  const events: Ev[] = [
    // session A: full buyer path
    ev("A", "page_view", { path: "/" }), ev("A", "search", { label: "3 acre noida", props: { results: 2 } }), ev("A", "listing_view", { label: "plot-1", path: "/listing/plot-1" }),
    ev("A", "auth_open"), ev("A", "auth_success", { user_id: "u1" }), ev("A", "contact_unlock", { user_id: "u1" }),
    // session B: bounces
    ev("B", "page_view", { path: "/" }),
    // session C: seller who leaves at the location step
    ev("C", "page_view", { path: "/post-listing" }), ev("C", "form_step", { label: "post", props: { step: "details" }, path: "/post-listing" }),
    ev("C", "form_step", { label: "post", props: { step: "location" }, path: "/post-listing" }), ev("C", "form_field", { label: "post", props: { field: "microMarket" }, path: "/post-listing" }),
    // session D: zero-result search + CTA clicks
    ev("D", "page_view", { path: "/" }), ev("D", "click", { label: "Search", path: "/" }), ev("D", "search", { label: "10 acre delhi", props: { results: 0 } }),
    ev("D", "click", { label: "Search", path: "/" }),
  ];
  const r = buildReport(events);

  it("counts visitors, sessions and bounce", () => {
    expect(r.overview.visitors).toBe(4);
    expect(r.overview.sessions).toBe(4);
    expect(r.overview.bounceRate).toBe(25); // only B bounced
  });
  it("builds the buyer funnel in order", () => {
    const by = Object.fromEntries(r.buyerFunnel.map((s) => [s.key, s.sessions]));
    expect(by).toMatchObject({ visit: 4, search: 2, listing: 1, auth_open: 1, auth_ok: 1, unlock: 1, enquiry: 0 });
  });
  it("shows where the seller left", () => {
    expect(r.abandoned).toBe(1);
    expect(r.formDrop[0]).toMatchObject({ step: "location", sessions: 1 });
    expect(r.formDrop[0].lastField).toContain("microMarket");
  });
  it("ranks CTAs and finds empty searches", () => {
    expect(r.ctas[0]).toMatchObject({ label: "Search", clicks: 2 });
    expect(r.zeroResult[0].query).toBe("10 acre delhi");
  });
});

describe("launch switches", () => {
  it("defaults to documents off, AI screening on, brokers off", () => {
    expect(DEFAULT_FEATURES).toMatchObject({ collectDocuments: false, aiScreening: true, humanReview: false, brokers: false });
  });
  it("sanitises stored values", () => {
    expect(cleanFeatures({ brokers: "yes", unlockLimitPerDay: 9999 })).toMatchObject({ brokers: false, unlockLimitPerDay: 200 });
    expect(cleanFeatures({ humanReview: true, unlockLimitPerDay: 5 })).toMatchObject({ humanReview: true, unlockLimitPerDay: 5 });
  });
});
