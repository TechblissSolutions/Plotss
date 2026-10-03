"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseBrowserConfigured, supabaseBrowser } from "@/lib/supabase/client";

/**
 * Landed on after clicking the email link from AuthModal's "Forgot password?" (resetPasswordForEmail).
 * @supabase/ssr's browser client auto-detects the recovery token in the URL on load and exchanges it for
 * a short-lived session — by the time this component renders, `supabase.auth.updateUser` is simply
 * "change the password of whoever is currently signed in" against that recovery session.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured) return;
    const sb = supabaseBrowser();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // The event can fire before this listener attaches; a session already present means the link already worked.
    void sb.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setErr("");
    if (password.length < 6) return setErr("Password must be at least 6 characters");
    if (password !== confirmPassword) return setErr("Passwords do not match");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (!isSupabaseBrowserConfigured) {
    return <p className="text-sm text-stone">Password reset needs Supabase Auth to be configured — not available in demo mode.</p>;
  }

  if (done) {
    return <p className="text-sm text-moss" role="status">Password updated. Redirecting you to sign in…</p>;
  }

  if (!ready) {
    return <p className="text-sm text-stone">Checking your reset link… If this doesn&apos;t change in a few seconds, the link may have expired — request a new one from the <a href="/login" className="font-semibold text-clay underline">sign-in page</a>.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-stone">New password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="hairline mt-1 w-full rounded-md bg-white px-3 py-2.5" />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-stone">Confirm new password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your new password" className="hairline mt-1 w-full rounded-md bg-white px-3 py-2.5" />
      </div>
      <button disabled={busy} onClick={submit} className="paint-graphite w-full rounded-md px-4 py-2.5 font-medium text-ivory">
        {busy ? "Saving…" : "Set new password"}
      </button>
      {err && <p className="text-sm text-clay" role="alert">{err}</p>}
    </div>
  );
}
