"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDbReady } from "@/lib/db/listings";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { createSessionClient } from "@/lib/supabase/server";

type SelfCapability = "can_sell";

/** Mark the signed-in user as having completed (or skipped) the onboarding flow. */
export async function markOnboardedAction(): Promise<void> {
  const s = await getSession();
  if (!s) return;
  if (!(await isDbReady())) return;
  const svc = createServiceClient();
  await svc.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", s.id);
}

/** Self-service: the signed-in user grants themselves a capability. */
export async function selfAddCapabilityAction(
  capability: SelfCapability
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Not signed in." };
  if (!(await isDbReady())) return { ok: false, error: "Not available in demo mode." };

  const svc = createServiceClient();
  const update: Record<string, unknown> = {};
  if (capability === "can_sell") {
    update.can_sell = true;
    update.can_sell_activated_at = new Date().toISOString();
  }

  const { error } = await svc
    .from("account_capabilities")
    .upsert({ user_id: s.id, can_buy: true, ...update }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/dashboard/seller");
  return { ok: true };
}

/**
 * DPDP right-to-erasure: soft-delete the signed-in user's account.
 * Blocked if the user has active listings (draft/pending/live).
 * Sets profiles.deleted_at; getSession() will sign them out on next request.
 * Hard-delete from auth.users is a separate manual/Edge-Function step.
 */
export async function deleteAccountAction(): Promise<{ error?: string }> {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await isDbReady())) return { error: "Not available in demo mode." };

  const svc = createServiceClient();

  // Block deletion if active listings exist
  const { count } = await svc
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", s.id)
    .in("status", ["draft", "pending", "live"]);

  if ((count ?? 0) > 0) {
    return { error: "Remove or archive all active listings before deleting your account." };
  }

  // Soft-delete
  const { error } = await svc
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", s.id);

  if (error) return { error: error.message };

  // Sign out (best-effort; getSession will also catch deleted_at on next request)
  const client = await createSessionClient();
  await client.auth.signOut();

  redirect("/");
}

/** Self-service: the signed-in user removes a capability from themselves. Blocked if they have active listings. */
export async function selfRemoveCapabilityAction(
  capability: SelfCapability
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Not signed in." };
  if (!(await isDbReady())) return { ok: false, error: "Not available in demo mode." };

  const svc = createServiceClient();

  if (capability === "can_sell") {
    const { count } = await svc
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", s.id)
      .in("status", ["draft", "pending", "live"]);
    if ((count ?? 0) > 0) {
      return { ok: false, error: `You have ${count} active listing(s). Resolve them before disabling seller access.` };
    }
  }

  const update: Record<string, unknown> = {};
  if (capability === "can_sell") {
    update.can_sell = false;
    update.can_sell_activated_at = null;
  }

  const { error } = await svc
    .from("account_capabilities")
    .upsert({ user_id: s.id, ...update }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
