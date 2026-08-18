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
  title: "Free Construction Calculators & Contractor Software",
  description:
    "Free construction calculators for cement, concrete, concrete volume, brick, steel, rebar, paint, and tile. Work out how many bags of cement you need for a slab, cubic yards of concrete for a footing, or bricks for a wall — then build BOQs, GST-ready quotations, and invoices for your contracting business.",
  keywords: [
    "cement calculator",
    "concrete calculator",
    "concrete volume calculator",
    "concrete yard calculator",
    "brick calculator",
    "steel calculator",
    "rebar calculator",
    "paint calculator",
    "tile calculator",
    "cement calculator for slab",
    "bags of cement calculator",
    "portland cement calculator",
    "sand and cement calculator",
    "brick calculator wall",
    "brick calculator patio",
    "paver brick calculator",
    "fire pit brick calculator",
    "retaining wall brick calculator",
    "construction project management software",
    "construction management software",
    "contractor software",
    "estimating software",
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
