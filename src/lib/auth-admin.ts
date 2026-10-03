import "server-only";
import { requireAdmin } from "./auth";
import { getSession } from "./session";

/** Admin guard that also returns the admin's display name (for greetings). */
export async function requireAuthAdminName(): Promise<string> {
  await requireAdmin();
  return (await getSession())?.name || "Admin";
}
