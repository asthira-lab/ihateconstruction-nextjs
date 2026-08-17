import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

/**
 * sitemap.xml — served at /sitemap.xml.
 *
 * Only public, indexable pages belong here. Authenticated routes are excluded
 * and additionally blocked in robots.ts. When adding a new calculator, extend
 * `CALCULATOR_SLUGS`; when adding a marketing page, extend `STATIC_PAGES`.
 */

// Keep in sync with the calculator config registry.
const CALCULATOR_SLUGS = [
  "cement-calculator",
  "concrete-calculator",
  "brick-calculator",
  "paint-calculator",
  "tile-calculator",
  "steel-calculator",
] as const;

// Marketing / SEO pages — priority + freq reflect how often each page really
// changes. Homepage + /calculators are the primary entry funnels.
const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/calculators", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Single build-time timestamp keeps all entries consistent for this deploy.
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency,
      priority,
    }),
  );

  const calculatorEntries: MetadataRoute.Sitemap = CALCULATOR_SLUGS.map(
    (slug) => ({
      url: `${siteUrl}/calculators/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      // Calculator pages are the primary SEO surface — rank just below homepage.
      priority: 0.9,
    }),
  );

  return [...staticEntries, ...calculatorEntries];
}
