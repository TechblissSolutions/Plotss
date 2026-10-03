import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { addRedirect, deleteRedirect } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Redirects" };

export default async function RedirectsPage() {
  await requireAdmin();
  const { data } = await createServiceClient().from("redirects").select("*").order("created_at", { ascending: false });
  const rows = data ?? [];
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Redirects</h1>
      <p className="text-sm text-slate-500">Send an old URL to a new one (301 keeps search ranking). Changes apply within a minute.</p>
      <form action={addRedirect} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_6rem_auto]">
        <input name="from" required placeholder="/old-path" className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="to" required placeholder="/new-path or https://…" className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm" />
        <select name="code" className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm"><option value="301">301</option><option value="302">302</option></select>
        <button className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">Add</button>
      </form>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {rows.map((r) => (
          <div key={r.from_path} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span className="min-w-0 truncate">{r.from_path} → {r.to_path} <span className="text-slate-500">({r.status_code})</span></span>
            <form action={deleteRedirect}><input type="hidden" name="from" value={r.from_path} /><button className="text-red-700">Delete</button></form>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-slate-500">No redirects.</p>}
      </div>
    </main>
  );
}
