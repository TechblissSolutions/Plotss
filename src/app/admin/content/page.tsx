import { requireAdmin } from "@/lib/auth";
import { getContent, HIDDEN_BY_DEFAULT } from "@/lib/content/store";
import registry from "@/lib/content/registry.json";
import { ContentEditor } from "./ContentEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content" };

export default async function ContentPage() {
  await requireAdmin();
  const state = await getContent();
  const sections = [...new Set([...registry.sections, ...HIDDEN_BY_DEFAULT])];
  return <ContentEditor items={registry.texts} sections={sections} initial={state} />;
}
