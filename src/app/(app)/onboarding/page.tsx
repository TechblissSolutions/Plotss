import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { markOnboardedAction, selfAddCapabilityAction } from "../self-actions";

export const metadata = { title: "Welcome to PLOTSS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const s = await getSession();
  if (!s) redirect("/?login=1");

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="font-serif-headline text-2xl font-bold text-graphite">Welcome to PLOTSS</h1>
        <p className="mt-2 text-sm text-stone">What brings you here today?</p>

        <div className="mt-8 flex flex-col gap-3">
          {/* Option 1: Find land */}
          <form action={async () => { "use server"; await markOnboardedAction(); redirect("/search"); }}>
            <button
              type="submit"
              className="w-full rounded-xl border border-line bg-white px-5 py-4 text-left transition hover:border-graphite hover:shadow-sm"
            >
              <div className="font-semibold text-graphite">Find land</div>
              <div className="mt-0.5 text-sm text-stone">Browse plots, industrial, and commercial land for sale or lease.</div>
            </button>
          </form>

          {/* Option 2: List land */}
          <form
            action={async () => {
              "use server";
              await markOnboardedAction();
              await selfAddCapabilityAction("can_sell");
              redirect("/post-listing");
            }}
          >
            <button
              type="submit"
              className="w-full rounded-xl border border-line bg-white px-5 py-4 text-left transition hover:border-graphite hover:shadow-sm"
            >
              <div className="font-semibold text-graphite">List my land</div>
              <div className="mt-0.5 text-sm text-stone">Post your property and reach verified buyers on PLOTSS.</div>
            </button>
          </form>

          {/* Option 3: Broker */}
          <form action={async () => { "use server"; await markOnboardedAction(); redirect("/search"); }}>
            <button
              type="submit"
              className="w-full rounded-xl border border-line bg-white px-5 py-4 text-left transition hover:border-graphite hover:shadow-sm"
            >
              <div className="font-semibold text-graphite">I&apos;m a broker / agent</div>
              <div className="mt-0.5 text-sm text-stone">We&apos;ll review your application and get in touch. Meanwhile, you can browse listings.</div>
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <form action={async () => { "use server"; await markOnboardedAction(); redirect("/search"); }} className="inline">
            <button type="submit" className="text-sm text-stone underline underline-offset-2 hover:text-graphite">
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
