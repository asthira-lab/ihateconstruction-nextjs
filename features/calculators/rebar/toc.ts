// Server-only helper: extract article headings (## level) from a locale's MDX
// file so the on-page TOC always matches the rendered human content.

import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { headingToId } from "./slug";

export interface TocEntry {
  id: string;
  label: string;
}

// Match exactly one #-run of length 2 followed by a space — excludes ### and deeper.
const H2_LINE = /^## [^#]/;

function inline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

// Cache per-locale so repeated calls in one render don't re-read the file.
export const getRebarToc = cache((locale: string): TocEntry[] => {
  const file = path.join(process.cwd(), "content", "rebar", `${locale}.mdx`);
  const source = fs.readFileSync(file, "utf8");
  const entries: TocEntry[] = [];
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!H2_LINE.test(line)) continue;
    const label = inline(line.slice(3));
    entries.push({ id: headingToId(label), label });
  }
  return entries;
});
