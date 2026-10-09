"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseBrowserConfigured, supabaseBrowser } from "@/lib/supabase/client";
import { useData } from "@/ui/data/DataProvider";
import { track } from "@/ui/tracking/tracker";

const OPEN_EVENT = "plotss:auth";
export const openAuth = () => window.dispatchEvent(new Event(OPEN_EVENT));

export function LoginTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button type="button" onClick={openAuth} className={className}>{children}</button>;
}

type Step = "choose" | "role";
const ROLES = [
  { id: "buyer", title: "Buyer", text: "Find and compare verified land" },
  { id: "seller", title: "Seller", text: "List your own land" },
  { id: "broker", title: "Broker", text: "Manage many listings & leads" },
] as const;

/** `inline` renders the same sign-in flow as a full page (/login, /register) instead of a pop-up. */
export function AuthModal({ inline }: { inline?: "login" | "register" } = {}) {
  const router = useRouter();
  const { features } = useData();
  const [open, setOpen] = useState(Boolean(inline));
  const [mode, setMode] = useState<"login" | "register">(inline ?? "login");
  const [intended, setIntended] = useState<string>("buyer");
  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const live = isSupabaseBrowserConfigured;

  useEffect(() => {
    if (inline) return; // the full-page version has no pop-up behaviour; the global pop-up handles Google returns
    const on = () => { setOpen(true); setStep("choose"); setErr(""); track('auth_open'); };
    window.addEventListener(OPEN_EVENT, on);
    // e.g. redirected from a protected page with /?login=1
    if (new URLSearchParams(location.search).get('login') === '1') on();
    // Brand-new Google sign-ins come back here already signed in: ask them which role they need.
    if (live) {
      void (async () => {
        const sb = supabaseBrowser();
        const { data: { user } } = await sb.auth.getUser();
        if (user && sessionStorage.getItem('plotss-auth-pending')) {
          const fromPage = sessionStorage.getItem('plotss-auth-pending') === 'page';
          sessionStorage.removeItem('plotss-auth-pending'); track('auth_success', undefined, { method: 'google' });
          const { data: pr } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
          const role = pr?.role ?? 'buyer'; // the on_auth_user_created trigger may not have replicated yet; default to buyer rather than stalling
          if (role === 'admin') { router.push('/admin'); return; }
          const want = sessionStorage.getItem('plotss-intended-role');
          sessionStorage.removeItem('plotss-intended-role');
          const fresh = Date.now() - new Date(user.created_at).getTime() < 5 * 60_000;
          if (want && want !== 'buyer' && role === 'buyer' && fresh) {
            await sb.from('profiles').update({ role: want }).eq('id', user.id);
            router.push(`/dashboard/${want}`); return;
          }
          if (fromPage) { router.push(`/dashboard/${role}`); return; }
        }
        if (!user || sessionStorage.getItem('plotss-role-asked') === user.id) return;
        if (Date.now() - new Date(user.created_at).getTime() > 5 * 60_000) return;
        const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (p?.role === 'buyer') { sessionStorage.setItem('plotss-role-asked', user.id); setOpen(true); setStep('role'); }
      })();
    }
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);

  if (!open) return null;

  const done = async () => {
    track('auth_success', undefined, { method: live ? 'live' : 'demo' });
    if (!inline) setOpen(false);
    if (live) {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (p?.role === 'admin') { router.push('/admin'); return; } // super admin lands in the admin panel
        if (inline) { router.push(`/dashboard/${p?.role ?? 'buyer'}`); return; }
      }
    }
    router.refresh();
  };

  async function guard(fn: () => Promise<void>) {
    setBusy(true); setErr(""); setNotice("");
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong"); }
    setBusy(false);
  }

  const google = () => guard(async () => {
    try {
      sessionStorage.setItem('plotss-auth-pending', inline ? 'page' : 'google');
      if (mode === 'register') sessionStorage.setItem('plotss-intended-role', intended);
    } catch { /* ignore */ }
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) throw error;
  });

  const emailLogin = () => guard(async () => {
    if (!email || !password) throw new Error("Enter your email and password");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) throw error;
    done();
  });

  const forgotPassword = () => guard(async () => {
    if (!email) throw new Error("Enter your email address first, then tap “Forgot password”");
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` });
    if (error) throw error;
    setNotice("Password reset link sent — check your email.");
  });

  const emailRegister = () => guard(async () => {
    if (!fullName.trim()) throw new Error("Enter your full name");
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) throw new Error("Enter a valid 10-digit mobile number");
    if (!email) throw new Error("Enter your email");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    if (password !== confirmPassword) throw new Error("Passwords do not match");
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: fullName.trim(), phone: `+91${digits}` }, emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding` } });
    if (error) throw error;
    if (!data.session) {
      // Email confirmation is switched on for this Supabase project: no session yet.
      setNotice("Check your email to confirm your account, then sign in.");
      switchMode("login");
      return;
    }
    const patch: { role?: string; phone: string } = { phone: `+91${digits}` };
    if (intended !== "buyer") patch.role = intended;
    await sb.from("profiles").update(patch).eq("id", data.user!.id);
    done();
    router.push(intended === "buyer" ? "/dashboard/buyer" : `/dashboard/${intended}`);
  });

  const pickRole = (role: string) => guard(async () => {
    if (live) {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (user && role !== "buyer") {
        const { error } = await sb.from("profiles").update({ role }).eq("id", user.id);
        if (error) throw error;
      }
    } else {
      await fetch("/api/dev-login", { method: "POST", body: JSON.stringify({ role, name: "Demo " + role }) });
    }
    done();
    router.push(role === "buyer" ? "/dashboard/buyer" : `/dashboard/${role}`);
  });

  const switchMode = (m: "login" | "register") => {
    if (m === mode) return;
    setMode(m); setStep("choose"); setErr("");
    if (inline) router.replace(`/${m}`);
  };

  const headline = step === "role" ? "How will you use PLOTSS?" : inline ? (mode === "login" ? "Welcome back" : "Create your free account") : "Sign in or create account";
  const POINTS = [
    ["Verified owner contacts", "Names and numbers unlock the moment you sign in."],
    ["Match alerts", "New listings that fit your past searches."],
    ["Site-visit scheduling", "Book inspections without calling five brokers."],
  ];

  const shell = inline ? "" : "fixed inset-0 z-50 grid place-items-center bg-graphite/70 p-3";
  return (
    <div className={shell} {...(inline ? {} : { role: "dialog", "aria-modal": true, onClick: () => setOpen(false) })}>
      <div className={`grid w-full max-w-4xl overflow-hidden rounded-lg md:grid-cols-[1.05fr_1fr] ${inline ? "mx-auto border border-line bg-white shadow-sm" : "bg-ivory"}`} onClick={(e) => e.stopPropagation()}>
        <aside className="paint-graphite hidden flex-col justify-between p-8 text-ivory md:flex">
          <div>
            <div className="font-display text-2xl">PLOTSS</div>
            <h3 className="mt-10 text-3xl leading-tight" style={{ color: "var(--c-ivory)" }}>
              Land for Ghaziabad, Noida &amp; New Delhi. <span className="text-signal">Free to join.</span>
            </h3>
            <ul className="mt-8 space-y-3">
              {POINTS.map(([t, d]) => (
                <li key={t} className="rounded-md border border-ivory/15 bg-ivory/5 p-3">
                  <div className="text-sm font-semibold">{t}</div>
                  <div className="text-xs opacity-70">{d}</div>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs opacity-50">Sign in with Google, or your email and password.</p>
        </aside>

        <section className="relative p-6 sm:p-8">
          {!inline && <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-stone">✕</button>}
          {inline ? <h1 className="pr-6 text-2xl">{headline}</h1> : <h4 className="pr-6 text-2xl">{headline}</h4>}
          <p className="mt-1 text-sm text-stone">
            {step === "role" ? "Pick one — you can change it later from your dashboard." : "One step. Your details are never shared without consent."}
          </p>

          {inline && step === "choose" && (
            <div role="tablist" aria-label="Sign in or register" className="mt-5 grid grid-cols-2 gap-1 rounded-md border border-line bg-sand p-1 text-sm font-semibold">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-sm py-2 transition-colors ${mode === m ? "paint-graphite text-ivory" : "text-stone hover:text-graphite"}`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>
          )}

          {step === "choose" && (
            <div className="mt-6 space-y-3">
              {mode === "register" && (
                <fieldset className="pb-2">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-stone">I want to</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {ROLES.filter((r) => r.id !== "broker" || features.brokers).map((r) => (
                      <label key={r.id} className={`cursor-pointer rounded-md border p-3 text-sm ${intended === r.id ? "border-clay bg-white" : "border-line bg-white/60"}`}>
                        <input type="radio" name="intended-role" value={r.id} checked={intended === r.id} onChange={() => setIntended(r.id)} className="sr-only" />
                        <span className="block font-semibold">{r.id === "buyer" ? "Buy land" : r.id === "seller" ? "Sell my land" : "List as a broker"}</span>
                        <span className="block text-xs text-stone">{r.text}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {live && (
                <button disabled={busy} onClick={google} className="hairline w-full rounded-md bg-white px-4 py-3 font-medium">
                  Continue with Google
                </button>
              )}
              {live && <div className="flex items-center gap-3 text-xs text-stone"><span className="h-px flex-1 bg-line" />or {mode === "login" ? "login" : "register"} with email<span className="h-px flex-1 bg-line" /></div>}
              {live ? (
                <div className="space-y-2">
                  {mode === "register" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-stone">Full name</label>
                        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="hairline mt-1 w-full rounded-md bg-white px-3 py-2.5" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-stone">Mobile number</label>
                        <div className="mt-1 flex gap-2">
                          <span className="hairline rounded-md bg-white px-3 py-2.5 num">+91</span>
                          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="10-digit number" className="hairline w-full rounded-md bg-white px-3 py-2.5 num" />
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-stone">Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="hairline mt-1 w-full rounded-md bg-white px-3 py-2.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-stone">Password</label>
                      {mode === "login" && (
                        <button type="button" disabled={busy} onClick={forgotPassword} className="text-xs font-semibold text-clay underline">Forgot password?</button>
                      )}
                    </div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "Minimum 6 characters" : "Your password"} className="hairline mt-1 w-full rounded-md bg-white px-3 py-2.5" />
                  </div>
                  {mode === "register" && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-stone">Confirm password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="hairline mt-1 w-full rounded-md bg-white px-3 py-2.5" />
                    </div>
                  )}
                  <button disabled={busy} onClick={mode === "login" ? emailLogin : emailRegister} className="paint-graphite w-full rounded-md px-4 py-2.5 font-medium text-ivory">
                    {mode === "login" ? "Login" : "Create account"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone">Demo mode: Supabase Auth is not connected. Use the role buttons below to continue.</p>
              )}
            </div>
          )}

          {!live && step === "choose" && (
            <div className="mt-6 grid gap-3">
              {ROLES.filter((r) => r.id !== 'broker' || features.brokers).map((r) => (
                <button key={r.id} disabled={busy} onClick={() => pickRole(r.id)}
                  className="hairline rounded-lg bg-white p-4 text-left transition-colors hover:border-clay">
                  <div className="font-display text-lg">{r.title}</div>
                  <div className="text-sm text-stone">{r.text}</div>
                </button>
              ))}
            </div>
          )}

          {step === "role" && (
            <div className="mt-6 grid gap-3">
              {ROLES.filter((r) => r.id !== 'broker' || features.brokers).map((r) => (
                <button key={r.id} disabled={busy} onClick={() => pickRole(r.id)}
                  className="hairline rounded-lg bg-white p-4 text-left transition-colors hover:border-clay">
                  <div className="font-display text-lg">{r.title}</div>
                  <div className="text-sm text-stone">{r.text}</div>
                </button>
              ))}
            </div>
          )}

          {notice && <p className="mt-4 text-sm text-moss" role="status">{notice}</p>}
          {err && <p className="mt-4 text-sm text-clay" role="alert">{err}</p>}
        </section>
      </div>
    </div>
  );
}
