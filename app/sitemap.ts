import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";
import { locales } from "./i18n-config";
import { CALCULATORS } from "@/features/calculators/registry";

// One entry per (locale × path); each carries alternates.languages for hreflang.

// Marketing / SEO pages — priority + freq reflect how often each really changes.
const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/calculators", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

// Build hreflang map once per path (same for every locale-variant of that URL).
function alternates(path: string) {
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
  );
  return { languages: { ...languages, "x-default": `${siteUrl}/en${path}` } };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const out: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of STATIC_PAGES) {
    for (const locale of locales) {
      out.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: alternates(path),
      });
    }
  }

  // Derived from registry — sitemap stays in sync when calculators ship.
  const liveSlugs = CALCULATORS.filter((c) => c.status === "live").map((c) => c.slug);
  for (const slug of liveSlugs) {
    const path = `/calculators/${slug}`;
    for (const locale of locales) {
      out.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified,
        changeFrequency: "monthly",
        // Calculator pages are the primary SEO surface — rank just below homepage.
        priority: 0.9,
        alternates: alternates(path),
      });
    }
  }

  return out;
}
