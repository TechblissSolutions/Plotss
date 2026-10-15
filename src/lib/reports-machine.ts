/** Pure state-machine logic for the Reports & Complaints lifecycle. No DB imports — testable in isolation. */

export const REPORT_STATUSES = [
  "open",
  "investigating",
  "awaiting_information",
  "escalated",
  "resolved",
  "dismissed",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_CATEGORIES = [
  "spam",
  "fraud",
  "misleading",
  "duplicate",
  "inappropriate",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  spam: "Spam",
  fraud: "Fraud / scam",
  misleading: "Misleading info",
  duplicate: "Duplicate listing",
  inappropriate: "Inappropriate content",
  other: "Other",
};

export const SEVERITY_LABELS: Record<ReportSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  awaiting_information: "Awaiting information",
  escalated: "Escalated",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

/** Which statuses each status can transition to (admin only). */
export const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  open: ["investigating", "dismissed"],
  investigating: ["awaiting_information", "escalated", "resolved", "dismissed"],
  awaiting_information: ["investigating", "dismissed"],
  escalated: ["investigating", "resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};

/** Transitions that require a non-empty reason string. */
const REASON_REQUIRED = new Set<string>([
  "open->dismissed",
  "investigating->escalated",
  "investigating->resolved",
  "investigating->dismissed",
  "awaiting_information->dismissed",
  "escalated->resolved",
  "escalated->dismissed",
]);

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function transitionRequiresReason(from: ReportStatus, to: ReportStatus): boolean {
  return REASON_REQUIRED.has(`${from}->${to}`);
}

export type TransitionResult = { ok: true } | { ok: false; error: string };

export function validateTransition(
  from: ReportStatus,
  to: ReportStatus,
  reason: string,
): TransitionResult {
  if (!REPORT_STATUSES.includes(to)) {
    return { ok: false, error: `Unknown status: '${to}'` };
  }
  if (!canTransition(from, to)) {
    return { ok: false, error: `Cannot move from '${STATUS_LABELS[from]}' to '${STATUS_LABELS[to]}'` };
  }
  if (transitionRequiresReason(from, to) && !reason.trim()) {
    return { ok: false, error: "A reason is required for this status change" };
  }
  return { ok: true };
}

export function isTerminal(status: ReportStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/** Validate description for a new complaint submission. */
export function validateDescription(description: string): TransitionResult {
  const trimmed = description.trim();
  if (trimmed.length < 20) return { ok: false, error: "Description must be at least 20 characters" };
  if (trimmed.length > 5000) return { ok: false, error: "Description must be under 5000 characters" };
  return { ok: true };
}

/** Validate reporter email when submitting anonymously. */
export function validateReporterEmail(email: string): TransitionResult {
  const trimmed = email.trim();
  if (trimmed.length === 0) return { ok: true }; // optional for anonymous
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { ok: false, error: "Invalid email address" };
  return { ok: true };
}
