"use client";

import { useMemo, useState, useTransition } from "react";
import { buildThemeCss, fontsHref } from "@/lib/theme/css";
import { DEFAULT_THEME, FONT_OPTIONS } from "@/lib/theme/defaults";
import { COLOR_KEYS, COLOR_LABELS, type ColorKey, type Paint, type ThemeSettings } from "@/lib/theme/types";
import { saveThemeAction } from "./actions";

// Admin chrome uses fixed neutral colours so a bad theme can never lock you out of the editor.
const label = "block text-xs font-medium text-slate-600 mb-1";
const input = "w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900";

function Slider(props: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className={label}>
        {props.label} <span className="float-right tabular-nums text-slate-900">{props.value}{props.unit}</span>
      </span>
      <input
        type="range" className="w-full accent-slate-900"
        min={props.min} max={props.max} step={props.step} value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

function FontSelect(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={label}>{props.label}</span>
      <select className={input} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {Object.keys(FONT_OPTIONS).map((f) => <option key={f}>{f}</option>)}
      </select>
    </label>
  );
}

function PaintField(props: { name: ColorKey; paint: Paint; onChange: (p: Paint) => void }) {
  const { paint, onChange } = props;
  const meta = COLOR_LABELS[props.name];
  const preview = paint.mode === "gradient"
    ? `linear-gradient(${paint.angle}deg, ${paint.color}, ${paint.to})`
    : paint.color;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl border border-slate-300" style={{ background: preview }} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-900">{meta.label}</div>
          <div className="truncate text-xs text-slate-500">{meta.hint}</div>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-slate-300 text-xs">
          {(["solid", "gradient"] as const).map((m) => (
            <button
              key={m} type="button"
              onClick={() => onChange({ ...paint, mode: m })}
              className={`px-2 py-1 capitalize ${paint.mode === m ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input type="color" value={paint.color} onChange={(e) => onChange({ ...paint, color: e.target.value })} className="h-8 w-10" />
        <input className={input} value={paint.color} onChange={(e) => onChange({ ...paint, color: e.target.value })} spellCheck={false} />
        {paint.mode === "gradient" && (
          <>
            <span className="text-slate-500">→</span>
            <input type="color" value={paint.to} onChange={(e) => onChange({ ...paint, to: e.target.value })} className="h-8 w-10" />
            <input className={input} value={paint.to} onChange={(e) => onChange({ ...paint, to: e.target.value })} spellCheck={false} />
          </>
        )}
      </div>
      {paint.mode === "gradient" && (
        <div className="mt-2">
          <Slider label="Angle" value={paint.angle} min={0} max={360} step={5} unit="°" onChange={(angle) => onChange({ ...paint, angle })} />
        </div>
      )}
    </div>
  );
}

function Preview() {
  return (
    <div className="space-y-6 p-6">
      <div className="paint-graphite rounded-lg p-8 text-ivory">
        <span className="ai-tag">AI search</span>
        <h1 className="mt-4 text-ivory">Find land the way you describe it.</h1>
        <p className="mt-3 max-w-md opacity-80">
          Search in plain language, verify with confidence, close without leaving the platform.
        </p>
        <div className="mt-6 flex gap-3">
          <button className="paint-clay rounded-md px-4 py-2 text-sm font-medium text-ivory">Search land</button>
          <button className="rounded-md border border-ivory/40 px-4 py-2 text-sm">For brokers</button>
        </div>
      </div>

      <div className="hairline rounded-lg bg-ivory/60 p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h4>3 acre MIDC plot, Chakan</h4>
            <p className="text-sm text-stone">Pune · Industrial · Zone: MIDC</p>
          </div>
          <span className="ai-tag">92% match</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div className="num text-2xl font-semibold">₹1.85 Cr</div>
          <span className="paint-moss rounded-sm px-2 py-0.5 text-xs font-medium text-ivory">✓ Verified</span>
        </div>
        <p className="mt-4 text-sm">
          Level plot with 60 ft road access and 3-phase power. Body copy shows the chosen font, weight and line-height so
          you can judge readability before publishing.
        </p>
      </div>

      <div>
        <h2>Heading 2</h2>
        <h3 className="mt-2">Heading 3</h3>
        <h5 className="mt-2">Heading 5</h5>
      </div>
    </div>
  );
}

export function ThemeEditor({ initial }: { initial: ThemeSettings }) {
  const [theme, setTheme] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const css = useMemo(() => buildThemeCss(theme, ".theme-preview"), [theme]);
  const dirty = JSON.stringify(theme) !== JSON.stringify(initial);

  const setColor = (k: ColorKey, p: Paint) => setTheme((t) => ({ ...t, colors: { ...t.colors, [k]: p } }));
  const setType = <K extends keyof ThemeSettings["typography"]>(k: K, v: ThemeSettings["typography"][K]) =>
    setTheme((t) => ({ ...t, typography: { ...t.typography, [k]: v } }));
  const setUi = <K extends keyof ThemeSettings["ui"]>(k: K, v: ThemeSettings["ui"][K]) =>
    setTheme((t) => ({ ...t, ui: { ...t.ui, [k]: v } }));

  const save = () =>
    start(async () => {
      try {
        setTheme(await saveThemeAction(theme));
        setMsg({ ok: true, text: "Saved. Live on the site now." });
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
      }
    });

  const { typography: t, ui } = theme;

  return (
    <div className="text-slate-900">
      <link rel="stylesheet" href={fontsHref(theme)} />
      <style>{css}</style>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <div className="text-lg font-semibold">Theme &amp; Design</div>
          <p className="text-xs text-slate-500">Colours, typography and UI — applied to the whole site.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
          <button
            type="button" className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
            onClick={() => { setTheme(DEFAULT_THEME); setMsg(null); }}
          >
            Reset to defaults
          </button>
          <button
            type="button" disabled={pending || !dirty} onClick={save}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="space-y-8">
          <section>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Colours</div>
            <div className="space-y-2">
              {COLOR_KEYS.map((k) => (
                <PaintField key={k} name={k} paint={theme.colors[k]} onChange={(p) => setColor(k, p)} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Typography</div>
            <FontSelect label="Heading font" value={t.headingFont} onChange={(v) => setType("headingFont", v)} />
            <FontSelect label="Body font" value={t.bodyFont} onChange={(v) => setType("bodyFont", v)} />
            <FontSelect label="Numbers / data font" value={t.dataFont} onChange={(v) => setType("dataFont", v)} />
            <Slider label="Heading weight" value={t.headingWeight} min={300} max={900} step={100} onChange={(v) => setType("headingWeight", v)} />
            <Slider label="Body weight" value={t.bodyWeight} min={300} max={700} step={100} onChange={(v) => setType("bodyWeight", v)} />
            <Slider label="Base font size" value={t.baseSize} min={13} max={20} step={1} unit="px" onChange={(v) => setType("baseSize", v)} />
            <Slider label="Body line-height" value={t.bodyLineHeight} min={1.2} max={2.2} step={0.05} onChange={(v) => setType("bodyLineHeight", +v.toFixed(2))} />
            <Slider label="Heading line-height" value={t.headingLineHeight} min={0.9} max={1.6} step={0.05} onChange={(v) => setType("headingLineHeight", +v.toFixed(2))} />
            <Slider label="Heading letter-spacing" value={t.headingTracking} min={-0.08} max={0.1} step={0.005} unit="em" onChange={(v) => setType("headingTracking", +v.toFixed(3))} />
            <Slider label="Heading size scale" value={t.scaleRatio} min={1.1} max={1.6} step={0.025} onChange={(v) => setType("scaleRatio", +v.toFixed(3))} />
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">UI</div>
            <Slider label="Corner radius" value={ui.radius} min={0} max={32} step={1} unit="px" onChange={(v) => setUi("radius", v)} />
            <Slider label="Border width" value={ui.borderWidth} min={0} max={4} step={1} unit="px" onChange={(v) => setUi("borderWidth", v)} />
            <Slider label="Content width" value={ui.containerWidth} min={960} max={1600} step={20} unit="px" onChange={(v) => setUi("containerWidth", v)} />
            <Slider label="Section spacing" value={ui.sectionSpacing} min={32} max={200} step={4} unit="px" onChange={(v) => setUi("sectionSpacing", v)} />
            <label className="block">
              <span className={label}>Card shadow</span>
              <select className={input} value={ui.shadow} onChange={(e) => setUi("shadow", e.target.value as "none" | "soft")}>
                <option value="none">None (flat)</option>
                <option value="soft">Soft</option>
              </select>
            </label>
          </section>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Live preview</div>
          <div
            className="theme-preview overflow-hidden rounded-lg border border-slate-300"
            style={{
              background: "var(--f-ivory)",
              color: "var(--c-graphite)",
              fontFamily: "var(--t-font-body)",
              fontWeight: "var(--t-weight-body)" as unknown as number,
              lineHeight: "var(--t-lh-body)",
              fontSize: "var(--t-base)",
            }}
          >
            <Preview />
          </div>
        </div>
      </div>
    </div>
  );
}

