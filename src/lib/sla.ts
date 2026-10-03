/** Admin decision commitment for a newly submitted listing — see docs/29-agent-progress-tracker.md's architecture decisions. */
export const VERIFICATION_SLA_BUSINESS_DAYS = 23;

/** Adds `days` business days (Mon-Fri) to `start`. Indian public holidays are not excluded — open question,
 * see docs/29-agent-progress-tracker.md. */
export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export type SlaStatus = { deadline: Date; businessDaysLeft: number; overdue: boolean };

/** Where a pending listing stands against the verification SLA, counted from submission (`createdAt`). */
export function slaStatus(createdAt: string | Date, totalDays: number = VERIFICATION_SLA_BUSINESS_DAYS): SlaStatus {
  const start = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const deadline = addBusinessDays(start, totalDays);
  const now = new Date();
  let businessDaysLeft = 0;
  const cursor = new Date(now);
  while (cursor < deadline) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) businessDaysLeft++;
  }
  return { deadline, businessDaysLeft, overdue: now > deadline };
}
