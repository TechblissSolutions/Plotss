"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { writeTheme } from "@/lib/theme/store";
import type { ThemeSettings } from "@/lib/theme/types";

export async function saveThemeAction(theme: ThemeSettings) {
  await requireAdmin();
  const saved = await writeTheme(theme);
  updateTag("theme");
  return saved;
}
