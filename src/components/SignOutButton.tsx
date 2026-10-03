"use client";

import { useRouter } from "next/navigation";
import { isSupabaseBrowserConfigured, supabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function out() {
    if (isSupabaseBrowserConfigured) await supabaseBrowser().auth.signOut();
    else await fetch("/api/dev-login", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }
  return <button onClick={out} className="text-stone">Sign out</button>;
}
