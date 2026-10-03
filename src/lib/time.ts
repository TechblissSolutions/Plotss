/** Timestamp N days ago. Kept outside components so pages stay pure for the React linter. */
export const daysAgo = (n: number): number => Date.now() - n * 86_400_000;

/** "5 min ago", "3 days ago", or a date for older items. */
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
