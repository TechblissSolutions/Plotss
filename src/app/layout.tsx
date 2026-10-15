import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSeoGlobal, jsonLd, orgLd, websiteLd } from "@/lib/seo";
import { buildThemeCss, fontsHref } from "@/lib/theme/css";
import { getTheme } from "@/lib/theme/store";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const g = await getSeoGlobal();
  return {
    metadataBase: new URL(g.siteUrl),
    applicationName: g.siteName,
    title: { default: g.siteName, template: g.titleTemplate },
    description: g.description,
    ...(g.noindexAll ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [theme, g] = await Promise.all([getTheme(), getSeoGlobal()]);

  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Mobile-native: notch-safe viewport + theme-color per scheme */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8fafc" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontsHref(theme)} />
        <style id="site-theme" dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(orgLd(g)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteLd(g)) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
