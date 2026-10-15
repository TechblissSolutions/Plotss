"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { suspendUser, reactivateUser, updateUserCapability, type CapabilityKey } from "@/lib/db/admin";

function s(f: FormData, k: string, max = 256): string {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

export async function suspendUserAction(f: FormData): Promise<void> {
  await requireAdmin();
  const userId = s(f, "userId", 64);
  const reason = s(f, "reason", 500);
  if (!userId || !reason) return;
  const session = await getSession();
  if (!session || userId === session.id) return;
  await suspendUser(session.id, userId, reason);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function reactivateUserAction(f: FormData): Promise<void> {
  await requireAdmin();
  const userId = s(f, "userId", 64);
  if (!userId) return;
  const session = await getSession();
  if (!session) return;
  await reactivateUser(session.id, userId);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateCapabilityAction(f: FormData): Promise<void> {
  await requireAdmin();
  const userId = s(f, "userId", 64);
  const capability = s(f, "capability", 32) as CapabilityKey;
  const value = f.get("value") === "true";
  const brokerId = s(f, "brokerId", 64) || undefined;
  const reason = s(f, "reason", 500);
  if (!userId) return;
  const validCaps: CapabilityKey[] = ["can_buy", "can_sell", "is_broker_staff"];
  if (!validCaps.includes(capability)) return;
  const session = await getSession();
  if (!session) return;
  await updateUserCapability(session.id, userId, capability, value, { brokerId, reason });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function reassignBrokerAction(f: FormData): Promise<void> {
  await requireAdmin();
  const userId = s(f, "userId", 64);
  const brokerId = s(f, "brokerId", 64);
  const reason = s(f, "reason", 500);
  if (!userId) return;
  const session = await getSession();
  if (!session) return;
  if (brokerId) {
    await updateUserCapability(session.id, userId, "is_broker_staff", true, { brokerId, reason: reason || "Broker reassigned" });
  } else {
    await updateUserCapability(session.id, userId, "is_broker_staff", false, { reason: reason || "Broker removed" });
  }
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
