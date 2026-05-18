import { renderMarkdownWithToc } from "@/lib/markdown";
import { GuideLayout } from "./GuideLayout";

export const dynamic = "force-static";

export default async function GuideEntretienPage() {
  const { html, tocItems, wordCount } = await renderMarkdownWithToc(
    "docs/guide_entretien.md"
  );

  return <GuideLayout html={html} tocItems={tocItems} wordCount={wordCount} />;
}
