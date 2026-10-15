"use client";

import { useState, useTransition } from "react";
import { updateEmailAction, updatePasswordAction } from "./actions";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="hairline w-full rounded-md bg-white px-3 py-2.5 text-sm" />;
}

function SubmitBtn({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button disabled={busy} className="paint-graphite rounded-md px-4 py-2 text-sm font-medium text-ivory disabled:opacity-60">
      {busy ? "Saving…" : children}
    </button>
  );
}

function StatusMsg({ result }: { result: { error?: string; ok?: boolean } | null }) {
  if (!result) return null;
  if (result.error) return <p className="text-sm text-clay" role="alert">{result.error}</p>;
  return <p className="text-sm text-moss" role="status">Saved successfully.</p>;
}

export default function AdminAccountPage() {
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState<{ error?: string; ok?: boolean } | null>(null);

  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwdResult, setPwdResult] = useState<{ error?: string; ok?: boolean } | null>(null);

  const handleEmail = () => {
    setEmailResult(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", email);
      const res = await updateEmailAction(fd);
      setEmailResult(res.error ? res : { ok: true });
      if (!res.error) setEmail("");
    });
  };

  const handlePassword = () => {
    setPwdResult(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("current", current);
      fd.set("password", newPwd);
      fd.set("confirm", confirm);
      const res = await updatePasswordAction(fd);
      setPwdResult(res.error ? res : { ok: true });
      if (!res.error) { setCurrent(""); setNewPwd(""); setConfirm(""); }
    });
  };

  return (
    <div className="max-w-xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">Account security</h1>
        <p className="mt-1 text-sm text-stone">Change your admin email or password. Changes take effect immediately.</p>
      </div>

      {/* Email section */}
      <section className="rounded-lg border border-line bg-white p-5 space-y-4">
        <h2 className="font-semibold">Change email</h2>
        <p className="text-xs text-stone">Supabase will send a confirmation link to the new address. Your current email stays active until you confirm.</p>
        <Field label="New email address">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new@email.com" />
        </Field>
        <div className="flex items-center gap-3">
          <SubmitBtn busy={isPending}>Update email</SubmitBtn>
          <StatusMsg result={emailResult} />
        </div>
      </section>

      {/* Password section */}
      <section className="rounded-lg border border-line bg-white p-5 space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your current password" />
        </Field>
        <Field label="New password">
          <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 8 characters" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" />
        </Field>
        <div className="flex items-center gap-3">
          <SubmitBtn busy={isPending}>Update password</SubmitBtn>
          <StatusMsg result={pwdResult} />
        </div>
      </section>
    </div>
  );
}
