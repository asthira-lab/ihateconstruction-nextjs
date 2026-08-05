import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

/**
 * sitemap.xml — served at /sitemap.xml.
 *
 * Only public, indexable pages belong here. Authenticated routes
 * (/dashboard, /projects, /settings, /login, ...) are intentionally
 * excluded and additionally blocked in robots.ts.
 *
 * When adding a new calculator, extend `CALCULATOR_SLUGS`. When adding
 * a marketing page, extend `STATIC_PAGES`. Blog posts should be added
 * dynamically once the CMS is wired up in Phase 3.
 */

// Keep in sync with the calculator config registry (see ROADMAP.md Phase 6).
const CALCULATOR_SLUGS = [
  "concrete",
  "brick",
  "paint",
  "tile",
  "steel",
] as const;

// Marketing / SEO pages — priority + freq reflect how often each page
// realistically changes. `/` and `/calculators` are the entry funnels.
const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/calculators", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // A single build-time timestamp keeps all entries consistent for this deploy.
  // Replace with per-page `updatedAt` from the CMS/DB once available.
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
      // Calculator pages are the primary SEO surface (see seo.md keyword
      // volumes) — rank them just below the homepage.
      priority: 0.9,
    }),
  );

  return [...staticEntries, ...calculatorEntries];
}
