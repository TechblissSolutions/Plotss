import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ShaderBackground } from "@/components/ShaderBackground";
import { markOnboardedAction, selfAddCapabilityAction } from "../self-actions";

export const metadata = { title: "Welcome to PLOTSS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const s = await getSession();
  if (!s) redirect("/?login=1");

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center px-4 py-12 overflow-hidden">
      <ShaderBackground opacity={0.05} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 w-full max-w-md">
        {/* Card — subtle entrance via CSS animation, no JS required */}
        <div
          className="rounded-2xl border border-line bg-white/95 backdrop-blur-sm p-8 shadow-sm"
          style={{
            animation: 'onboard-in 0.55s cubic-bezier(0.23,1,0.32,1) both',
          }}
        >
          <style>{`
            @keyframes onboard-in {
              from { opacity: 0; transform: translateY(20px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes option-in {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .onboard-option { animation: none !important; }
            }
          `}</style>

          <h1 className="font-serif-headline text-2xl font-bold text-graphite">Welcome to PLOTSS</h1>
          <p className="mt-2 text-sm text-stone">What brings you here today?</p>

          <div className="mt-8 flex flex-col gap-3">
            {/* Option 1: Find land */}
            <form action={async () => { "use server"; await markOnboardedAction(); redirect("/search"); }}>
              <button
                type="submit"
                className="onboard-option w-full rounded-xl border border-line bg-white px-5 py-4 text-left transition-all active:scale-[0.98] active:border-graphite"
                style={{ animation: 'option-in 0.5s cubic-bezier(0.23,1,0.32,1) 0.1s both' }}
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
                className="onboard-option w-full rounded-xl border border-line bg-white px-5 py-4 text-left transition-all active:scale-[0.98] active:border-graphite"
                style={{ animation: 'option-in 0.5s cubic-bezier(0.23,1,0.32,1) 0.17s both' }}
              >
                <div className="font-semibold text-graphite">List my land</div>
                <div className="mt-0.5 text-sm text-stone">Post your property and reach verified buyers on PLOTSS.</div>
              </button>
            </form>

            {/* Option 3: Broker */}
            <form action={async () => { "use server"; await markOnboardedAction(); redirect("/search"); }}>
              <button
                type="submit"
                className="onboard-option w-full rounded-xl border border-line bg-white px-5 py-4 text-left transition-all active:scale-[0.98] active:border-graphite"
                style={{ animation: 'option-in 0.5s cubic-bezier(0.23,1,0.32,1) 0.24s both' }}
              >
                <div className="font-semibold text-graphite">I&apos;m a broker / agent</div>
                <div className="mt-0.5 text-sm text-stone">We&apos;ll review your application and get in touch. Meanwhile, you can browse listings.</div>
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <form action={async () => { "use server"; await markOnboardedAction(); redirect("/search"); }} className="inline">
              <button type="submit" className="text-sm text-stone underline underline-offset-2 transition-colors active:text-graphite">
                Skip for now
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
