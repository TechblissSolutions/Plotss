"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { submitReportAction } from "./actions";
import { REPORT_CATEGORIES, CATEGORY_LABELS, type ReportCategory } from "@/lib/reports-machine";

const fieldCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1.5";

export default function ReportPage() {
  const [state, action, pending] = useActionState(submitReportAction, null);
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id");
  const userId = searchParams.get("user_id");

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Report a problem</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use this form to report a fraudulent listing, spam, misleading content, or inappropriate user conduct.
          All reports are reviewed by our moderation team.
        </p>
      </div>

      {state?.error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Hidden context fields */}
        {propertyId && (
          <input type="hidden" name="property_id" value={propertyId} />
        )}
        {userId && (
          <input type="hidden" name="reported_user_id" value={userId} />
        )}

        {/* Category */}
        <div>
          <label className={labelCls} htmlFor="category">Category <span className="text-red-500">*</span></label>
          <select id="category" name="category" required className={fieldCls}>
            <option value="">Select a category…</option>
            {REPORT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat as ReportCategory]}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls} htmlFor="description">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={20}
            maxLength={5000}
            rows={6}
            className={fieldCls}
            placeholder="Describe the problem in detail — what happened, when, and any reference numbers or links (min 20 characters)."
          />
        </div>

        {/* Contact email (for anonymous reporters) */}
        <div>
          <label className={labelCls} htmlFor="reporter_email">
            Your email <span className="text-slate-400 font-normal normal-case tracking-normal">(optional — for follow-up)</span>
          </label>
          <input
            type="email"
            id="reporter_email"
            name="reporter_email"
            className={fieldCls}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <p className="mt-1 text-xs text-slate-400">
            If not provided, your report will be anonymous. We won&apos;t share your email.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          By submitting this form you confirm that the information provided is accurate to the best of your knowledge.
          False reports may result in account action.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </main>
  );
}
