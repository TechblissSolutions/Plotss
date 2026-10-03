"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isDbReady } from "@/lib/db/listings";

export type Requirement = { city: string; category: string; maxBudgetCr: number | null };

const clean = (f: FormData): Requirement => {
  const budget = Number(String(f.get("maxBudgetCr") ?? "").replace(/[^\d.]/g, ""));
  return {
    city: String(f.get("city") ?? "").slice(0, 60),
    category: String(f.get("category") ?? "").slice(0, 30),
    maxBudgetCr: Number.isFinite(budget) && budget > 0 ? Math.min(budget, 100000) : null,
  };
};

/** What the buyer is looking for. Stored privately on their account and used to show matching listings. */
export async function saveRequirement(f: FormData) {
  const s = await getSession();
  if (!s || !(await isDbReady())) return;
  const svc = createServiceClient();
  const { data } = await svc.auth.admin.getUserById(s.id);
  await svc.auth.admin.updateUserById(s.id, { user_metadata: { ...(data.user?.user_metadata ?? {}), requirement: clean(f) } });
  revalidatePath("/dashboard/buyer");
}
