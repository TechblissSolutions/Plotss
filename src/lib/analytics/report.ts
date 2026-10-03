/**
 * Turns raw journey events into the numbers the admin dashboard shows.
 * Pure functions (no database access) so they can be unit-tested.
 */
export type Ev = {
  at: string; vid: string; sid: string; user_id: string | null; type: string; path: string | null; label: string | null;
  props: Record<string, string | number | boolean> | null; referrer: string | null; utm_source: string | null; device: string | null;
};

export type FunnelStep = { key: string; label: string; sessions: number; ofPrevious: number | null; ofFirst: number | null };
export type Row = { key: string; a: number; b?: number; c?: number; d?: number };

const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
const num = (v: unknown) => (typeof v === "number" ? v : 0);

function bySession(events: Ev[]) {
  const m = new Map<string, Ev[]>();
  for (const e of events) { const l = m.get(e.sid); if (l) l.push(e); else m.set(e.sid, [e]); }
  for (const l of m.values()) l.sort((a, b) => a.at.localeCompare(b.at));
  return m;
}

function funnel(sessions: Map<string, Ev[]>, steps: { key: string; label: string; test: (e: Ev) => boolean }[]): FunnelStep[] {
  const counts = steps.map(() => 0);
  for (const evs of sessions.values()) {
    // a session counts for a step if it hit that step (order is not enforced, but each step needs the previous one)
    let reached = true;
    steps.forEach((s, i) => {
      if (reached && evs.some(s.test)) counts[i]++; else reached = false;
    });
  }
  return steps.map((s, i) => ({
    key: s.key, label: s.label, sessions: counts[i],
    ofPrevious: i === 0 ? null : pct(counts[i], counts[i - 1]), ofFirst: i === 0 ? null : pct(counts[i], counts[0]),
  }));
}

const host = (u: string | null) => { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } };

export function buildReport(events: Ev[]) {
  const sessions = bySession(events);
  const pageViews = events.filter((e) => e.type === "page_view");
  const visitors = uniq(events.map((e) => e.vid));

  /* ---- overview ---- */
  let bounced = 0;
  for (const evs of sessions.values()) {
    const pv = evs.filter((e) => e.type === "page_view").length;
    if (pv <= 1 && !evs.some((e) => e.type === "click" || e.type === "search" || e.type === "form_step")) bounced++;
  }
  const sidsByVid = new Map<string, Set<string>>();
  for (const e of events) { const s = sidsByVid.get(e.vid) ?? new Set(); s.add(e.sid); sidsByVid.set(e.vid, s); }
  const returning = [...sidsByVid.values()].filter((s) => s.size > 1).length;
  const overview = {
    visitors: visitors.length, sessions: sessions.size, pageViews: pageViews.length,
    pagesPerSession: sessions.size ? Math.round((pageViews.length / sessions.size) * 10) / 10 : 0,
    bounceRate: pct(bounced, sessions.size), returningVisitors: returning,
    signedInSessions: [...sessions.values()].filter((l) => l.some((e) => e.user_id)).length,
  };

  /* ---- pages ---- */
  const pageMap = new Map<string, { views: number; vids: Set<string>; ms: number[]; scroll: number[] }>();
  for (const e of events) {
    if (!e.path) continue;
    const p = pageMap.get(e.path) ?? { views: 0, vids: new Set(), ms: [], scroll: [] };
    if (e.type === "page_view") { p.views++; p.vids.add(e.vid); }
    if (e.type === "page_leave") { p.ms.push(num(e.props?.ms)); p.scroll.push(num(e.props?.maxScroll)); }
    pageMap.set(e.path, p);
  }
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const pages: Row[] = [...pageMap.entries()].filter(([, p]) => p.views > 0)
    .map(([path, p]) => ({ key: path, a: p.views, b: p.vids.size, c: Math.round(avg(p.ms) / 1000), d: avg(p.scroll) }))
    .sort((x, y) => y.a - x.a).slice(0, 25);

  /* ---- CTAs ---- */
  const viewsByPath = new Map(pages.map((p) => [p.key, p.a]));
  const cta = new Map<string, { path: string; label: string; clicks: number; vids: Set<string> }>();
  for (const e of events) {
    if (e.type !== "click" || !e.label) continue;
    const k = `${e.path ?? ""}||${e.label}`;
    const c = cta.get(k) ?? { path: e.path ?? "", label: e.label, clicks: 0, vids: new Set() };
    c.clicks++; c.vids.add(e.vid); cta.set(k, c);
  }
  const ctas = [...cta.values()].sort((x, y) => y.clicks - x.clicks).slice(0, 40)
    .map((c) => ({ label: c.label, path: c.path, clicks: c.clicks, visitors: c.vids.size, rate: pct(c.clicks, viewsByPath.get(c.path) ?? 0) }));

  /* ---- sources & devices ---- */
  const firstBySession = [...sessions.values()].map((l) => l[0]);
  const srcCount = new Map<string, number>();
  for (const e of firstBySession) {
    const s = e.utm_source || host(e.referrer) || "direct";
    srcCount.set(s, (srcCount.get(s) ?? 0) + 1);
  }
  const sources: Row[] = [...srcCount.entries()].map(([key, a]) => ({ key, a })).sort((x, y) => y.a - x.a).slice(0, 12);
  const devCount = new Map<string, number>();
  for (const e of firstBySession) devCount.set(e.device ?? "unknown", (devCount.get(e.device ?? "unknown") ?? 0) + 1);
  const devices: Row[] = [...devCount.entries()].map(([key, a]) => ({ key, a })).sort((x, y) => y.a - x.a);

  /* ---- buyer funnel ---- */
  const isPage = (p: string) => (e: Ev) => e.type === "page_view" && e.path === p;
  const buyerFunnel = funnel(sessions, [
    { key: "visit", label: "Visited the site", test: (e) => e.type === "page_view" },
    { key: "search", label: "Searched or opened Search", test: (e) => e.type === "search" || isPage("/search")(e) },
    { key: "listing", label: "Opened a listing", test: (e) => e.type === "listing_view" },
    { key: "auth_open", label: "Opened the sign-in window", test: (e) => e.type === "auth_open" },
    { key: "auth_ok", label: "Signed in", test: (e) => e.type === "auth_success" },
    { key: "unlock", label: "Unlocked a contact", test: (e) => e.type === "contact_unlock" },
    { key: "enquiry", label: "Sent an enquiry", test: (e) => e.type === "enquiry_sent" },
  ]);

  /* ---- seller funnel + drop-off ---- */
  const postSteps = ["details", "location", "documents", "photos", "description", "preview", "submit"];
  const sellerFunnel = funnel(sessions, [
    { key: "start", label: "Opened the seller form", test: isPage("/post-listing") },
    { key: "s1", label: "Step 1 · details", test: (e) => e.type === "form_step" && e.label === "post" && e.props?.step === "details" },
    { key: "s2", label: "Step 2 · location", test: (e) => e.type === "form_step" && e.label === "post" && e.props?.step === "location" },
    { key: "s4", label: "Step · photos", test: (e) => e.type === "form_step" && e.label === "post" && e.props?.step === "photos" },
    { key: "s5", label: "Step · description", test: (e) => e.type === "form_step" && e.label === "post" && e.props?.step === "description" },
    { key: "s6", label: "Step · preview & contact", test: (e) => e.type === "form_step" && e.label === "post" && e.props?.step === "preview" },
    { key: "auth", label: "Signed in to submit", test: (e) => e.type === "auth_success" },
    { key: "done", label: "Listing submitted", test: (e) => e.type === "listing_submitted" },
  ]);

  const drop = new Map<string, { sessions: number; fields: Map<string, number> }>();
  let abandoned = 0;
  for (const evs of sessions.values()) {
    if (!evs.some(isPage("/post-listing"))) continue;
    if (evs.some((e) => e.type === "listing_submitted")) continue;
    abandoned++;
    const steps = evs.filter((e) => e.type === "form_step" && e.label === "post").map((e) => String(e.props?.step ?? ""));
    const last = steps.length ? steps[steps.length - 1] : "left before starting";
    const field = [...evs].reverse().find((e) => e.type === "form_field")?.props?.field;
    const d = drop.get(last) ?? { sessions: 0, fields: new Map() };
    d.sessions++;
    if (typeof field === "string") d.fields.set(field, (d.fields.get(field) ?? 0) + 1);
    drop.set(last, d);
  }
  const order = ["left before starting", ...postSteps];
  const formDrop = [...drop.entries()].sort((x, y) => order.indexOf(x[0]) - order.indexOf(y[0])).map(([step, d]) => ({
    step, sessions: d.sessions,
    lastField: [...d.fields.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([f, n]) => `${f} (${n})`).join(", "),
  }));

  /* ---- search ---- */
  const q = new Map<string, { n: number; zero: number }>();
  for (const e of events) {
    if (e.type !== "search" || !e.label) continue;
    const k = e.label.toLowerCase();
    const r = q.get(k) ?? { n: 0, zero: 0 };
    r.n++; if (e.props?.results === 0) r.zero++;
    q.set(k, r);
  }
  const searches = [...q.entries()].map(([query, r]) => ({ query, count: r.n, zero: r.zero })).sort((x, y) => y.count - x.count).slice(0, 20);
  const zeroResult = searches.filter((s) => s.zero > 0).sort((x, y) => y.zero - x.zero).slice(0, 10);

  /* ---- recent sessions (for the journey viewer) ---- */
  const recent = [...sessions.entries()]
    .sort((x, y) => y[1][y[1].length - 1].at.localeCompare(x[1][x[1].length - 1].at)).slice(0, 25)
    .map(([sid, evs]) => ({
      sid: sid.slice(0, 8), start: evs[0].at, device: evs[0].device ?? "", source: evs[0].utm_source || host(evs[0].referrer) || "direct",
      signedIn: evs.some((e) => e.user_id),
      steps: evs.filter((e) => e.type !== "scroll" && e.type !== "form_field").slice(0, 40).map((e) => ({
        t: Math.round((Date.parse(e.at) - Date.parse(evs[0].at)) / 1000), type: e.type, what: e.label ?? e.path ?? "",
      })),
    }));

  return { overview, pages, ctas, sources, devices, buyerFunnel, sellerFunnel, formDrop, abandoned, searches, zeroResult, recent };
}

export type Report = ReturnType<typeof buildReport>;
