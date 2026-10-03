import { AuthModal } from "@/components/AuthModal";
import { ExitIntent } from "@/components/ExitIntent";
import { getContent } from "@/lib/content/store";
import { getSession } from "@/lib/session";
import { getSiteData } from "@/lib/site-data";
import { AppShell } from "@/ui/AppProvider";
import { ContentProvider } from "@/ui/content";
import { DataProvider } from "@/ui/data/DataProvider";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [session, data, content] = await Promise.all([getSession(), getSiteData(), getContent()]);
  return (
    <ContentProvider value={content}>
      <DataProvider value={data}>
        <AppShell session={session}>
          {children}
          <AuthModal />
          <ExitIntent />
        </AppShell>
      </DataProvider>
    </ContentProvider>
  );
}
