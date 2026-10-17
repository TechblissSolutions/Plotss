"use client";

import { useEffect } from "react";

// Renders when the root layout itself throws (e.g. getTheme() or getSeoGlobal() fails).
// Must include <html> and <body> — it replaces the root layout entirely.
// Cannot rely on theme CSS injected by the root layout; uses fallback token values from globals.css.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — PLOTSS</title>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100svh;padding:1rem}
          .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:2.5rem;text-align:center;max-width:420px;width:100%;box-shadow:0 4px 16px rgba(0,0,0,0.06)}
          .logo{font-size:1.125rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:1.5rem;color:#0f172a}
          h1{font-size:1.25rem;font-weight:600;margin-bottom:0.5rem}
          p{font-size:0.875rem;color:#64748b;line-height:1.6;margin-bottom:1.5rem}
          .ref{font-size:0.75rem;color:#94a3b8;font-family:monospace;margin-bottom:1.5rem}
          .actions{display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center}
          .btn-primary{background:#0f172a;color:#f8fafc;border:none;border-radius:8px;padding:0.625rem 1.25rem;font-size:0.875rem;font-weight:600;cursor:pointer}
          .btn-primary:active{transform:scale(0.97)}
          .btn-secondary{background:transparent;color:#0f172a;border:1px solid #e2e8f0;border-radius:8px;padding:0.625rem 1.25rem;font-size:0.875rem;font-weight:600;cursor:pointer;text-decoration:none}
          .btn-secondary:active{transform:scale(0.97)}
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="logo">PLOTSS</div>
          <h1>Something went wrong</h1>
          <p>
            We couldn&apos;t load the page. This is usually a temporary issue —
            please try again in a moment.
          </p>
          {error.digest && (
            <p className="ref">Ref: {error.digest}</p>
          )}
          <div className="actions">
            <button className="btn-primary" onClick={retry}>
              Try again
            </button>
            <a className="btn-secondary" href="/">
              Back to homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
