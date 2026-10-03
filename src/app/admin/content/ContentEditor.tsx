"use client";

import { useMemo, useState, useTransition } from "react";
import type { ContentState } from "@/ui/content";
import { saveContentAction } from "../actions";

type Item = { key: string; default: string; file: string };

const STATS = [
  ["home.stats.plots", "Stats bar: verified plots"],
  ["home.stats.cities", "Stats bar: cities"],
  ["home.stats.deals", "Stats bar: deals closed"],
];
const SECTION_LABELS: Record<string, string> = {
  "home.testimonials": "Homepage testimonials (hidden until you add real quotes)",
  "footer.rera-badges": "Footer RERA badges (show only if you hold these registrations)",
};

const input = "w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm";

export function ContentEditor({ items, sections, initial }: { items: Item[]; sections: string[]; initial: ContentState }) {
  const [state, setState] = useState(initial);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const groups = useMemo(() => {
    const needle = q.toLowerCase();
    const map = new Map<string, Item[]>();
    for (const it of items) {
      if (needle && !(it.key + it.default).toLowerCase().includes(needle)) continue;
      const g = it.key.split(".")[0];
      map.set(g, [...(map.get(g) ?? []), it]);
    }
    return [...map.entries()];
  }, [items, q]);

  const setText = (k: string, v: string) => setState((s) => ({ ...s, texts: { ...s.texts, [k]: v } }));
  const dirty = JSON.stringify(state) !== JSON.stringify(initial);

  const save = () =>
    start(async () => {
      try {
        // Drop empty overrides so the default text applies again.
        const texts = Object.fromEntries(Object.entries(state.texts).filter(([, v]) => v.trim() !== ""));
        setState(await saveContentAction({ ...state, texts }));
        setMsg({ ok: true, text: "Saved. Live on the site within a minute." });
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
      }
    });

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/95 px-6 py-3 backdrop-blur">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Site content</h1>
          <p className="text-xs text-slate-500">Leave a field empty to keep the built-in text. Every text on Home, Header and Footer is listed here.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
          <button disabled={pending || !dirty} onClick={save} className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40">
            {pending ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium">Sections</h2>
        {sections.map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!state.hidden[k]} onChange={(e) => setState((s) => ({ ...s, hidden: { ...s.hidden, [k]: !e.target.checked } }))} />
            {SECTION_LABELS[k] ?? k}
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium">Homepage numbers</h2>
        <p className="text-xs text-slate-500">Computed from live data by default (verified listings, cities with listings, sold). Only override with figures you can back up.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {STATS.map(([k, label]) => (
            <label key={k} className="block text-xs text-slate-600">{label}
              <input className={input + " mt-1"} placeholder="auto" value={state.texts[k] ?? ""} onChange={(e) => setText(k, e.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <input className={input} placeholder="Search text…" value={q} onChange={(e) => setQ(e.target.value)} />

      {groups.map(([group, list]) => (
        <section key={group} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium capitalize">{group} <span className="text-xs font-normal text-slate-500">({list.length})</span></h2>
          {list.map((it) => (
            <label key={it.key} className="block">
              <span className="mb-1 block text-[11px] text-slate-500">{it.key}</span>
              {it.default.length > 70 ? (
                <textarea rows={3} className={input} placeholder={it.default} value={state.texts[it.key] ?? ""} onChange={(e) => setText(it.key, e.target.value)} />
              ) : (
                <input className={input} placeholder={it.default} value={state.texts[it.key] ?? ""} onChange={(e) => setText(it.key, e.target.value)} />
              )}
            </label>
          ))}
        </section>
      ))}
    </main>
  );
}
