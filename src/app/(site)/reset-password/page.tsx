import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl">Choose a new password</h1>
        <p className="mt-1 text-sm text-stone">This only works from the link we emailed you.</p>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
