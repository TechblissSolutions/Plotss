"use server";

import { redirect } from "next/navigation";
import { createReport } from "@/lib/db/reports";
import { getSession } from "@/lib/session";
import {
  REPORT_CATEGORIES, REPORT_SEVERITIES,
  validateDescription, validateReporterEmail,
  type ReportCategory, type ReportSeverity,
} from "@/lib/reports-machine";

const s = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);

export async function submitReportAction(
  _prev: { error?: string } | null,
  f: FormData,
): Promise<{ error?: string } | null> {
  const category = s(f, "category", 40) as ReportCategory;
  const description = s(f, "description", 5500);
  const reporterEmail = s(f, "reporter_email", 320);
  const propertyId = s(f, "property_id", 64) || null;
  const reportedUserId = s(f, "reported_user_id", 64) || null;

  if (!REPORT_CATEGORIES.includes(category)) return { error: "Invalid category." };

  const descResult = validateDescription(description);
  if (!descResult.ok) return { error: descResult.error };

  if (reporterEmail) {
    const emailResult = validateReporterEmail(reporterEmail);
    if (!emailResult.ok) return { error: emailResult.error };
  }

  if (!propertyId && !reportedUserId) {
    return { error: "Please specify what you are reporting (a listing or a user)." };
  }

  const session = await getSession();

  const severity: ReportSeverity =
    REPORT_SEVERITIES.includes(s(f, "severity", 20) as ReportSeverity)
      ? (s(f, "severity", 20) as ReportSeverity)
      : "medium";

  const result = await createReport({
    category,
    description,
    severity,
    property_id: propertyId,
    reported_user_id: reportedUserId,
    reporter_id: session?.id ?? null,
    reporter_email: session ? null : (reporterEmail || null),
  });

  if (!result) return { error: "We could not submit your report. Please try again." };
  if ("rateLimited" in result) {
    return { error: "You have submitted too many reports recently. Please wait 24 hours before submitting again." };
  }

  redirect(`/report/submitted?ref=${result.ref}`);
}
