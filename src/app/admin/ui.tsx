import React from "react";

/** Small shared building blocks so every admin screen looks and behaves the same. Fixed colours on purpose (never themed). */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, note, children, className = "" }: { title?: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`} aria-label={title}>
      {title && (
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {note && <p className="text-xs text-slate-500">{note}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone = "default" }: { label: string; value: React.ReactNode; note?: string; tone?: "default" | "warn" | "good" }) {
  const ring = tone === "warn" ? "border-amber-300 bg-amber-50" : tone === "good" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${ring}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
    </div>
  );
}

const BADGE = {
  gray: "bg-slate-100 text-slate-700", green: "bg-emerald-100 text-emerald-800", amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800", blue: "bg-blue-100 text-blue-800",
} as const;
export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[tone]}`}>{children}</span>;
}

export const btn = {
  primary: "inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40",
  secondary: "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50",
  success: "inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700",
  danger: "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50",
  small: "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50",
};

export const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-blue-600 focus:outline-none";
export const label = "block text-xs font-medium text-slate-600";

/** Friendly empty state: say what is missing and what to do next. */
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{children}</p>}
    </div>
  );
}

/** Message box. Errors are announced immediately; others politely. */
export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "success"; children: React.ReactNode }) {
  const c = { info: "border-blue-200 bg-blue-50 text-blue-900", warn: "border-amber-300 bg-amber-50 text-amber-900", error: "border-red-300 bg-red-50 text-red-900", success: "border-emerald-200 bg-emerald-50 text-emerald-900" }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
