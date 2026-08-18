import type { MDXComponents } from "mdx/types";
import { headingToId } from "@/features/calculators/slug";

// Flatten React children (strings, elements, arrays) to plain text.
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

const components = {
  // h2 gets a slug id so the on-page TOC can deep-link into the article.
  h2: ({ children }: { children?: React.ReactNode }) => {
    const id = headingToId(textOf(children));
    return <h2 id={id} className="scroll-mt-24">{children}</h2>;
  },
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}