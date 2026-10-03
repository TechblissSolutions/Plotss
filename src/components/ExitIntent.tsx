"use client";

import { useEffect, useState } from "react";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; // e.g. 919876543210

/** Once-per-session exit-intent prompt. Renders only when a WhatsApp number is configured. */
export function ExitIntent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!WA) return;
    let seen = false;
    try { seen = sessionStorage.getItem("plotss-exit") === "1"; } catch { /* ignore */ }
    if (seen) return;
    const on = (e: MouseEvent) => {
      if (e.clientY > 10) return;
      setShow(true);
      try { sessionStorage.setItem("plotss-exit", "1"); } catch { /* ignore */ }
      document.removeEventListener("mouseout", on);
    };
    document.addEventListener("mouseout", on);
    return () => document.removeEventListener("mouseout", on);
  }, []);
  if (!show || !WA) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-graphite/60 p-4" onClick={() => setShow(false)}>
      <div className="hairline max-w-sm rounded-lg bg-ivory p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h4>Confused? Talk to our team.</h4>
        <p className="mt-2 text-sm text-stone">Tell us what you need and we&apos;ll shortlist verified land for you.</p>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi PLOTSS, I need help finding land.")}`}
          className="paint-moss mt-5 inline-block rounded-md px-5 py-2.5 font-medium text-ivory">Chat on WhatsApp</a>
      </div>
    </div>
  );
}
