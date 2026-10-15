import React from "react";

/** Admin design system — fixed slate palette, never themed. Inter font via layout. */

/* ── Typography scale ── */
export const adminType = {
  h1: "text-[22px] font-semibold tracking-[-0.02em] leading-7 text-slate-900",
  h2: "text-sm font-semibold leading-5 text-slate-900",
  label: "block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1.5",
  small: "text-xs text-slate-500 leading-5",
} as const;

/* ── Page header ── */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className={adminType.h1}>{title}</h1>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Card ── */
export function Card({
  title,
  note,
  children,
  className = "",
}: {
  title?: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}
      aria-label={title}
    >
      {title && (
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className={adminType.h2}>{title}</h2>
          {note && <p className="mt-0.5 text-xs leading-5 text-slate-500">{note}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ── Stat card ── */
export function Stat({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  tone?: "default" | "warn" | "good";
}) {
  const accent =
    tone === "warn"
      ? { border: "border-amber-200", dot: "bg-amber-400", val: "text-amber-700" }
      : tone === "good"
      ? { border: "border-emerald-200", dot: "bg-emerald-400", val: "text-emerald-700" }
      : { border: "border-slate-200/80", dot: "bg-slate-300", val: "text-slate-900" };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${accent.border}`}
    >
      <div className="flex items-center justify-between">
        <div className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
      </div>
      <div className={`mt-3 text-[28px] font-semibold tabular-nums leading-none tracking-[-0.03em] ${accent.val}`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.07em] text-slate-400">
        {label}
      </div>
      {note && <div className="mt-1 text-xs leading-4 text-slate-400">{note}</div>}
    </div>
  );
}

/* ── Badge ── */
const BADGE = {
  gray: "bg-slate-100 text-slate-600",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
} as const;

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: keyof typeof BADGE;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5 ${BADGE[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Button styles ── */
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98] disabled:opacity-40",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]",
  success:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 active:scale-[0.98]",
  small:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 active:scale-[0.98]",
} as const;

/* ── Form primitives ── */
export const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition";
export const label =
  "block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1.5";

/* ── Empty state ── */
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {children && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500">{children}</p>
      )}
    </div>
  );
}

/* ── Notice / alert ── */
const NOTICE = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warn: "border-amber-300 bg-amber-50 text-amber-900",
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
  red: "border-red-300 bg-red-50 text-red-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

export function Notice({
  tone = "info",
  className = "",
  children,
}: {
  tone?: keyof typeof NOTICE;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" || tone === "red" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${NOTICE[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
