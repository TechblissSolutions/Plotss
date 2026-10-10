/**
 * Tests for src/lib/notify.ts — ZeptoMail email dispatch.
 *
 * All external calls (fetch, Supabase) are mocked.
 * No real emails are sent. No production credentials required.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// ---- Supabase service client mock ----------------------------------------
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockGetUserById = vi.fn().mockResolvedValue({ data: { user: { email: "buyer@example.com" } } });

// from() returns different shapes depending on the table
const mockFrom = vi.fn((table: string) => {
  if (table === "notifications") return { insert: mockInsert };
  // profiles select chain used by userContact()
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { phone: "" } }),
      })),
    })),
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: mockFrom,
    auth: { admin: { getUserById: mockGetUserById } },
  }),
}));

// ---- Feature flags mock --------------------------------------------------
const mockFeatures = { notifyInApp: false, notifyEmail: true, notifyWhatsapp: false };
vi.mock("@/lib/features", () => ({ getFeatures: () => Promise.resolve(mockFeatures) }));

// ---- isDbReady mock -------------------------------------------------------
vi.mock("@/lib/db/listings", () => ({ isDbReady: () => Promise.resolve(true) }));

// ---- fetch mock ----------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// --------------------------------------------------------------------------

import { notify } from "../src/lib/notify";

const input = { userId: "user-123", title: "Listing approved", body: "Your listing is live.", link: "/listing/plot-abc" };

beforeEach(() => {
  vi.clearAllMocks();
  // Default: ZeptoMail returns 200
  mockFetch.mockResolvedValue({ ok: true, status: 200 });
  mockGetUserById.mockResolvedValue({ data: { user: { email: "buyer@example.com" } } });
  // Set env to zepto
  process.env.EMAIL_PROVIDER = "zepto";
  process.env.ZEPTO_HOST = "cpaas.zoho.com";
  process.env.ZEPTO_API_KEY = "rawencodedkeyonly";
  process.env.NOTIFY_EMAIL_FROM = "PLOTSS <noreply@plotss.com>";
});

afterEach(() => {
  delete process.env.EMAIL_PROVIDER;
  delete process.env.ZEPTO_HOST;
  delete process.env.ZEPTO_API_KEY;
  delete process.env.NOTIFY_EMAIL_FROM;
});

describe("notify() — ZeptoMail integration", () => {

  it("sends email via ZeptoMail with correct endpoint and headers", async () => {
    await notify(input);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://cpaas.zoho.com/v1.1/email");
    expect(opts.headers.Authorization).toBe("Zoho-enczapikey rawencodedkeyonly");
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("does NOT double-prefix the Authorization header (B1 regression)", async () => {
    // If ZEPTO_API_KEY accidentally contains the prefix, the header would be doubled.
    // The env var must be raw key only — this test enforces that expectation.
    await notify(input);

    const [, opts] = mockFetch.mock.calls[0];
    const auth: string = opts.headers.Authorization;
    const prefixCount = (auth.match(/Zoho-enczapikey/g) ?? []).length;
    expect(prefixCount).toBe(1);
  });

  it("sends correct ZeptoMail payload shape", async () => {
    await notify(input);

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.from).toEqual({ address: "noreply@plotss.com", name: "PLOTSS" });
    expect(body.to).toEqual([{ email_address: { address: "buyer@example.com" } }]);
    expect(body.subject).toBe("Listing approved");
    expect(body.textbody).toContain("Your listing is live.");
    expect(body.textbody).toContain("/listing/plot-abc");
  });

  it("is silent (no throw) when ZEPTO_API_KEY is missing", async () => {
    delete process.env.ZEPTO_API_KEY;
    await expect(notify(input)).resolves.toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("logs error but does not throw when ZeptoMail returns 4xx (B2)", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notify(input)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("401"));
    errorSpy.mockRestore();
  });

  it("does not send email when notifyEmail feature flag is off", async () => {
    mockFeatures.notifyEmail = false;
    await notify(input);
    expect(mockFetch).not.toHaveBeenCalled();
    mockFeatures.notifyEmail = true;
  });

  it("does not send email when recipient has no email address", async () => {
    mockGetUserById.mockResolvedValue({ data: { user: { email: "" } } });
    await notify(input);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not expose ZEPTO_API_KEY in error logs (B2 security)", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });
    const loggedMessages: string[] = [];
    const errorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
      loggedMessages.push(args.join(" "));
    });

    await notify(input);

    for (const msg of loggedMessages) {
      expect(msg).not.toContain("rawencodedkeyonly");
      expect(msg).not.toContain("Zoho-enczapikey");
    }
    errorSpy.mockRestore();
  });

  it("uses ZEPTO_HOST env var for endpoint", async () => {
    process.env.ZEPTO_HOST = "mail.zoho.eu";
    await notify(input);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://mail.zoho.eu/v1.1/email");
  });
});
