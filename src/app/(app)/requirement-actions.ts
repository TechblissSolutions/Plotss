"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isDbReady } from "@/lib/db/listings";

export type Requirement = {
  city: string;
  category: string;
  maxBudgetCr: number | null;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  notes?: string;
};

const clean = (f: FormData): Requirement => {
  const budget = Number(String(f.get("maxBudgetCr") ?? "").replace(/[^\d.]/g, ""));
  return {
    city: String(f.get("city") ?? "").slice(0, 60),
    category: String(f.get("category") ?? "").slice(0, 30),
    maxBudgetCr: Number.isFinite(budget) && budget > 0 ? Math.min(budget, 100000) : null,
  };
};

/** What the buyer is looking for. Stored in buyer_requirements table. */
export async function saveRequirement(f: FormData) {
  const s = await getSession();
  if (!s || !(await isDbReady())) return;
  const r = clean(f);
  const svc = createServiceClient();
  await svc.from("buyer_requirements").upsert(
    {
      user_id: s.id,
      city: r.city || null,
      category: r.category || null,
      max_budget_cr: r.maxBudgetCr,
    },
    { onConflict: "user_id" }
  );
  revalidatePath("/dashboard/buyer");
}

/** Load the buyer's saved requirement from buyer_requirements table. */
export async function loadRequirement(): Promise<Requirement | null> {
  const s = await getSession();
  if (!s || !(await isDbReady())) return null;
  const { data } = await createServiceClient()
    .from("buyer_requirements")
    .select("city, category, max_budget_cr, min_area_sqft, max_area_sqft, notes")
    .eq("user_id", s.id)
    .maybeSingle();
  if (!data) return null;
  return {
    city: data.city ?? "",
    category: data.category ?? "",
    maxBudgetCr: data.max_budget_cr ?? null,
    minAreaSqft: data.min_area_sqft ?? undefined,
    maxAreaSqft: data.max_area_sqft ?? undefined,
    notes: data.notes ?? undefined,
  };
}
