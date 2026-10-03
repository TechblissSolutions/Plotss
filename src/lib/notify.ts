import "server-only";
import { createServiceClient } from "./supabase/service";
import { getFeatures } from "./features";
import { isDbReady } from "./db/listings";

export type NotifyInput = { userId: string; title: string; body: string; link?: string };

/**
 * Single entry point for every outbound notification. Each channel is gated by its own
 * site_settings.features flag; email/WhatsApp also need a provider configured in env, so they silently
 * no-op (not throw) until one is wired in — see sendEmail/sendWhatsapp below. Callers never need to know
 * which channels are actually live.
 */
export async function notify(input: NotifyInput): Promise<void> {
  if (!(await isDbReady())) return;
  const f = await getFeatures();
  const jobs: Promise<unknown>[] = [];
  if (f.notifyInApp) jobs.push(Promise.resolve(createServiceClient().from("notifications").insert({ user_id: input.userId, title: input.title, body: input.body, link: input.link ?? null })));
  if (f.notifyEmail) jobs.push(sendEmail(input));
  if (f.notifyWhatsapp) jobs.push(sendWhatsapp(input));
  // A notification failing to send must never break the action that triggered it (approving a listing,
  // sending an enquiry, etc.) — log and move on.
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("notify() channel failed:", r.reason);
}

/** Notify several users with the same message in one go (e.g. every staff member of a client business). */
export async function notifyMany(userIds: string[], message: Omit<NotifyInput, "userId">): Promise<void> {
  await Promise.allSettled(userIds.map((userId) => notify({ ...message, userId })));
}

async function userContact(userId: string): Promise<{ email: string; phone: string }> {
  const svc = createServiceClient();
  const [{ data: auth }, { data: profile }] = await Promise.all([
    svc.auth.admin.getUserById(userId),
    svc.from("profiles").select("phone").eq("id", userId).maybeSingle(),
  ]);
  return { email: auth.user?.email ?? "", phone: profile?.phone ?? "" };
}

/** No-op until RESEND_API_KEY (or another provider) is set — see docs/29-agent-progress-tracker.md's open questions. */
async function sendEmail(input: NotifyInput): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const { email } = await userContact(input.userId);
  if (!email) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_EMAIL_FROM ?? "PLOTSS <notifications@plotss.in>",
      to: email,
      subject: input.title,
      text: input.link ? `${input.body}\n\n${input.link}` : input.body,
    }),
  });
}

/** No-op until an SMS/WhatsApp provider's credentials are set — see docs/29-agent-progress-tracker.md's open questions. */
async function sendWhatsapp(input: NotifyInput): Promise<void> {
  if (!process.env.MSG91_API_KEY) return;
  const { phone } = await userContact(input.userId);
  if (!phone) return;
  // Placeholder shape for MSG91's SMS API; swap for the real endpoint/payload once the account exists.
  await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: { authkey: process.env.MSG91_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ mobiles: phone.replace(/\D/g, ""), message: input.body }),
  });
}
