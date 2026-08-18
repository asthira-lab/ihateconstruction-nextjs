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

// Factory: returns a cached `(locale) => TocEntry[]` for one content directory.
export function getToc(contentDir: string) {
  return cache((locale: string): TocEntry[] => {
    const dir = path.join(process.cwd(), "content", contentDir);
    let file = path.join(dir, `${locale}.mdx`);
    if (!fs.existsSync(file)) file = path.join(dir, "en.mdx");
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
}
