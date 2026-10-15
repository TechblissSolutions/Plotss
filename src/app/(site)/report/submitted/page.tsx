import Link from "next/link";

export const metadata = { title: "Report Submitted — PLOTSS" };

export default async function ReportSubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Report received</h1>
      {sp.ref && (
        <p className="mt-2 font-mono text-sm text-slate-500">Reference: {sp.ref}</p>
      )}
      <p className="mt-4 text-sm leading-6 text-slate-500">
        Thank you for helping keep PLOTSS safe. Our moderation team will review your report and take appropriate action.
        If you provided an email address, we may reach out for more information.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Back to home
      </Link>
    </main>
  );
}
