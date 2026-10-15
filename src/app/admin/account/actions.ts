"use server";

import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export async function updateEmailAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const newEmail = (formData.get("email") as string | null)?.trim();
  if (!newEmail || !newEmail.includes("@")) return { error: "Valid email required" };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { error: error.message };
  return {};
}

export async function updatePasswordAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const current = formData.get("current") as string | null;
  const newPwd = formData.get("password") as string | null;
  const confirm = formData.get("confirm") as string | null;

  if (!current) return { error: "Current password required" };
  if (!newPwd || newPwd.length < 8) return { error: "New password must be at least 8 characters" };
  if (newPwd !== confirm) return { error: "Passwords do not match" };

  const supabase = await createSessionClient();

  // Re-authenticate with current password to verify it
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Session error — please sign in again" };

  const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (signInErr) return { error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: newPwd });
  if (error) return { error: error.message };
  return {};
}
