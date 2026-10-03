import { describe, expect, it } from "vitest";
import { addBusinessDays, slaStatus, VERIFICATION_SLA_BUSINESS_DAYS } from "../src/lib/sla";

describe("addBusinessDays", () => {
  it("skips weekends", () => {
    // Friday 2026-01-02 + 1 business day -> Monday 2026-01-05
    const d = addBusinessDays(new Date("2026-01-02T00:00:00"), 1);
    expect(d.getDay()).toBe(1); // Monday
  });

  it("never lands on a weekend for any count", () => {
    const start = new Date("2026-02-03T00:00:00"); // a Tuesday
    for (let n = 1; n <= 30; n++) {
      const d = addBusinessDays(start, n);
      expect([0, 6]).not.toContain(d.getDay());
    }
  });
});

describe("slaStatus", () => {
  it("is not overdue right after submission", () => {
    const s = slaStatus(new Date());
    expect(s.overdue).toBe(false);
    expect(s.businessDaysLeft).toBeGreaterThan(0);
    expect(s.businessDaysLeft).toBeLessThanOrEqual(VERIFICATION_SLA_BUSINESS_DAYS);
  });

  it("is overdue once the deadline has passed", () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - (VERIFICATION_SLA_BUSINESS_DAYS * 2 + 10));
    const s = slaStatus(longAgo);
    expect(s.overdue).toBe(true);
    expect(s.businessDaysLeft).toBe(0);
  });
});
