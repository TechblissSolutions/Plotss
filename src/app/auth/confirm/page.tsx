"use client";

/**
 * Handles Supabase implicit-flow email links (password recovery, email confirm).
 * These arrive as hash fragments: #access_token=...&type=recovery
 * Hash fragments never reach the server, so this client component reads them,
 * calls setSession, then redirects to the right page.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) { router.replace("/login?error=confirmation_failed"); return; }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    const errorCode = params.get("error_code");

    if (errorCode) {
      router.replace(`/login?error=${errorCode}`);
      return;
    }

    if (!accessToken || !refreshToken) {
      router.replace("/login?error=confirmation_failed");
      return;
    }

    void supabaseBrowser()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) { router.replace("/login?error=confirmation_failed"); return; }
        if (type === "recovery") { router.replace("/reset-password"); return; }
        // email confirmation or signup — go to onboarding/dashboard
        router.replace("/auth/callback?code=already-set");
      });
  }, []);

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-4">
      <p className="text-sm text-stone">Verifying your link…</p>
    </main>
  );
}
