import { readFile } from "fs/promises";
import path from "path";
import { marked, Renderer } from "marked";

export async function renderMarkdownFromPublic(relativePath: string) {
  const filePath = path.join(process.cwd(), "public", relativePath);
  const markdown = await readFile(filePath, "utf8");
  return marked.parse(markdown);
}

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function renderMarkdownWithToc(relativePath: string): Promise<{
  html: string;
  tocItems: TocItem[];
  wordCount: number;
}> {
  const filePath = path.join(process.cwd(), "public", relativePath);
  const markdown = await readFile(filePath, "utf8");

  const wordCount = markdown
    .replace(/#+\s/g, "")
    .replace(/[*_`>]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

  const tocItems: TocItem[] = [];
  const renderer = new Renderer();

  renderer.heading = ({ text, depth }) => {
    // Strip markdown bold/emphasis from heading text for display
    const cleanText = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    if (depth === 2 || depth === 3) {
      const id = slugify(cleanText);
      tocItems.push({ id, text: cleanText, depth: depth as 2 | 3 });
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    }
    return `<h${depth}>${text}</h${depth}>`;
  };

  marked.use({ renderer });
  const html = await marked.parse(markdown);

  return { html, tocItems, wordCount };
}
