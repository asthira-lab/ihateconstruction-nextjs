// Slugify a heading into an anchor id. Keeps unicode letters (ar/hi/de) so
// localized headings stay usable as `href="#…"` targets. Pure — shared by the
// MDX h2 component (for ids) and the server-side TOC extractor.

export function headingToId(heading: string): string {
  return heading
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[*_`[\]()]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
