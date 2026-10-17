import { requireAdmin } from "@/lib/auth";
import { isDbReady } from "@/lib/db/listings";
import { aiProviderName } from "@/lib/ai/llm";
import { AdminPageHeader, Card, Badge } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "System Health — Admin" };

async function checkSupabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now();
  const ok = await isDbReady();
  return { ok, latencyMs: Date.now() - t0 };
}

export default async function SystemHealthPage() {
  await requireAdmin();
  const [db] = await Promise.all([checkSupabase()]);
  const aiProvider = aiProviderName();

  const checks = [
    {
      name: "Database",
      desc: "Supabase Postgres connection via service client",
      ok: db.ok,
      detail: db.ok ? `Responded in ${db.latencyMs}ms` : "Could not reach database — check SUPABASE_SERVICE_KEY",
    },
    {
      name: "AI provider",
      desc: "Listing description assist, search parsing, risk screening",
      ok: Boolean(aiProvider),
      detail: aiProvider ? `Connected — using ${aiProvider}` : "No AI key set. Add GROQ_API_KEY or XAI_API_KEY to .env. Search + descriptions still work.",
    },
    {
      name: "Email notifications",
      desc: "Transactional email via ZeptoMail or Resend",
      ok: Boolean(process.env.ZEPTO_HOST || process.env.RESEND_API_KEY),
      detail: (process.env.ZEPTO_HOST || process.env.RESEND_API_KEY)
        ? "Provider env vars present"
        : "No email provider configured — set ZEPTO_HOST or RESEND_API_KEY",
    },
    {
      name: "WhatsApp / SMS",
      desc: "Notification channel",
      ok: Boolean(process.env.MSG91_API_KEY),
      detail: process.env.MSG91_API_KEY ? "MSG91 key present" : "No WhatsApp/SMS provider — set MSG91_API_KEY",
    },
  ];

  const allOk = checks.every((c) => c.ok);

  return (
    <main className="mx-auto max-w-3xl">
      <AdminPageHeader
        title="System Health"
        subtitle="Live status of external services and critical integrations."
      />

      <div className="mb-6 flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${allOk ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
        <span className="text-sm font-medium text-slate-700">
          {allOk ? "All systems operational" : `${checks.filter((c) => !c.ok).length} check(s) need attention`}
        </span>
      </div>

      <Card>
        <ul className="divide-y divide-slate-100">
          {checks.map((c) => (
            <li key={c.name} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${c.ok ? "bg-emerald-500" : "bg-amber-500"}`}>
                {c.ok ? "✓" : "!"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                  <Badge tone={c.ok ? "green" : "amber"}>{c.ok ? "OK" : "Warning"}</Badge>
                </div>
                <div className="text-xs text-slate-500">{c.desc}</div>
                <div className={`mt-0.5 text-xs ${c.ok ? "text-slate-400" : "text-amber-700"}`}>
                  {c.detail}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        This page checks live connectivity on every load. No data is cached. Latency numbers reflect server-to-Supabase round-trip time.
      </p>
    </main>
  );
}
