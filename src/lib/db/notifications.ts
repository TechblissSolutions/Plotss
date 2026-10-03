import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { isDbReady } from "./listings";

export type NotificationRow = { id: string; title: string; body: string; link: string | null; read: boolean; created_at: string };

export async function getNotifications(userId: string): Promise<NotificationRow[]> {
  if (!(await isDbReady())) return [];
  const { data } = await createServiceClient()
    .from("notifications").select("id,title,body,link,read,created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  return data ?? [];
}
