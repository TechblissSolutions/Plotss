import { requireAdmin } from "@/lib/auth";
import { getTheme } from "@/lib/theme/store";
import { ThemeEditor } from "./ThemeEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Theme & Design" };

export default async function ThemeAdminPage() {
  await requireAdmin();
  const theme = await getTheme();
  return <ThemeEditor initial={theme} />;
}
