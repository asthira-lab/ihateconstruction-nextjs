/**
 * Single source of truth for site-wide constants used by
 * `layout.tsx`, `sitemap.ts`, `robots.ts`, and OG image routes.
 *
 * Canonical production URL is `https://ihateconstruction.co`. Local dev
 * should set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to avoid
 * generating localhost-facing absolute URLs in metadata during dev.
 */

export const siteConfig = {
  name: "iHateConstruction",
  shortName: "ihateconstruction.co",
  // Keywords from seo.md — competitors ranking here: buildertrend, fieldwire,
  // contractor foreman, buildxact. Target: construction management + estimating.
  title:
    "iHateConstruction — Construction Management & Estimating Software",
  description:
    "Free construction calculators, BOQ builder, GST-ready quotations and invoices for contractors. Estimate concrete, steel, brick, paint, and tile costs — save projects and export professional PDFs.",
  keywords: [
    "construction project management software",
    "construction management software",
    "contractor software",
    "estimating software",
    "concrete calculator",
    "brick calculator",
    "steel calculator",
    "paint calculator",
    "tile calculator",
    "BOQ software",
    "quotation software",
    "GST invoice",
  ],
  locale: "en_IN",
  ogImage: "/og-default.png", // 1200x630, add later
} as const;

/**
 * Canonical site URL — no trailing slash. Used as `metadataBase` and to build
 * absolute URLs for the sitemap. Env override must include the protocol.
 */
export const siteUrl: string = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ihateconstruction.co"
).replace(/\/$/, "");
