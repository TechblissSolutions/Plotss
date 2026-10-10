import "server-only";
import { createServiceClient } from "./supabase/service";
import { getFeatures } from "./features";
import { isDbReady } from "./db/listings";

export type NotifyInput = { userId: string; title: string; body: string; link?: string };

export async function notify(input: NotifyInput): Promise<void> {
  if (!(await isDbReady())) return;
  const f = await getFeatures();
  const jobs: Promise<unknown>[] = [];
  if (f.notifyInApp) jobs.push(Promise.resolve(createServiceClient().from("notifications").insert({ user_id: input.userId, title: input.title, body: input.body, link: input.link ?? null })));
  if (f.notifyEmail) jobs.push(sendEmail(input));
  if (f.notifyWhatsapp) jobs.push(sendWhatsapp(input));
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("notify() channel failed:", r.reason);
}

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

// ---------------------------------------------------------------------------
// Email — provider selected via EMAIL_PROVIDER env var
//   "resend"  → RESEND_API_KEY          (default, current)
//   "zepto"   → ZEPTO_API_KEY
//   "zoho"    → ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET + ZOHO_REFRESH_TOKEN
//   "smtp"    → SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS  (any SMTP)
// Switching provider = change EMAIL_PROVIDER + add the new keys. No code change needed.
// ---------------------------------------------------------------------------
async function sendEmail(input: NotifyInput): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "resend";
  const from = process.env.NOTIFY_EMAIL_FROM ?? "PLOTSS <notifications@plotss.com>";
  const { email } = await userContact(input.userId);
  if (!email) return;
  const text = input.link ? `${input.body}\n\n${input.link}` : input.body;

  if (provider === "resend") {
    if (!process.env.RESEND_API_KEY) return;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject: input.title, text }),
    });
    return;
  }

  if (provider === "zepto") {
    if (!process.env.ZEPTO_API_KEY) return;
    // ZeptoMail Send Mail API — https://www.zeptomail.com/help/api.html
    await fetch("https://api.zeptomail.in/v1.1/email", {
      method: "POST",
      headers: { Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: from.match(/<(.+)>/)?.[1] ?? from, name: from.match(/^(.+?)\s*</)?.[1] ?? "PLOTSS" },
        to: [{ email_address: { address: email } }],
        subject: input.title,
        textbody: text,
      }),
    });
    return;
  }

  if (provider === "zoho") {
    // Zoho Mail API via OAuth — needs ZOHO_ACCOUNT_ID + access token exchange
    // Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ACCOUNT_ID
    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REFRESH_TOKEN) return;
    const tokenRes = await fetch("https://accounts.zoho.in/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET ?? "",
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      }),
    });
    const { access_token } = await tokenRes.json() as { access_token: string };
    await fetch(`https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fromAddress: from.match(/<(.+)>/)?.[1] ?? from, toAddress: email, subject: input.title, content: text, mailFormat: "plaintext" }),
    });
    return;
  }

  if (provider === "smtp") {
    // For SMTP use nodemailer — add it: npm install nodemailer @types/nodemailer
    // Needs: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    // Uncomment when nodemailer is installed:
    // const nodemailer = await import("nodemailer");
    // const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    // await t.sendMail({ from, to: email, subject: input.title, text });
    console.warn("notify: EMAIL_PROVIDER=smtp requires nodemailer — see src/lib/notify.ts");
  }
}

// ---------------------------------------------------------------------------
// WhatsApp / SMS — provider selected via WHATSAPP_PROVIDER env var
//   "msg91"    → MSG91_API_KEY  (default)
//   "twilio"   → TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM
// ---------------------------------------------------------------------------
async function sendWhatsapp(input: NotifyInput): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "msg91";
  const { phone } = await userContact(input.userId);
  if (!phone) return;
  const mobile = phone.replace(/\D/g, "");

  if (provider === "msg91") {
    if (!process.env.MSG91_API_KEY) return;
    await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: process.env.MSG91_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ mobiles: mobile, message: input.body }),
    });
    return;
  }

  if (provider === "twilio") {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return;
    const creds = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: process.env.TWILIO_FROM ?? "", To: `+${mobile}`, Body: input.body }),
    });
  }
}
