import { redirect } from "next/navigation";

/* General Settings consolidates with Launch Settings for now — redirect to avoid a dead end. */
export default function GeneralSettingsPage() {
  redirect("/admin/settings");
}
