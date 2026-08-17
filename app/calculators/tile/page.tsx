// /calculators/tile — server component. Page metadata + static content + form island.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { TILE_FAQ, TILE_STANDARDS } from "@/features/calculators/tile";
import { TileCalculatorForm } from "./TileCalculatorForm";

const PAGE_PATH = "/calculators/tile";
const TITLE = "Tile Calculator — Floor, Wall, Adhesive & Grout";
const DESCRIPTION =
  "Free tile calculator. Enter floor or wall area, pick a tile size, and get the exact tile count, adhesive quantity, and grout volume. Supports vitrified, ceramic, and traditional mortar-bed installation with wastage.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "tile calculator",
    "floor tile calculator",
    "wall tile calculator",
    "how many tiles do I need",
    "tile calculator square feet",
    "tile adhesive calculator",
    "grout calculator",
    "vitrified tile calculator",
    "ceramic tile calculator",
    "bathroom tile calculator",
    "kitchen tile calculator",
    "thin-set adhesive calculator",
    "mortar bed tile calculator India",
    "tile count calculator",
  ],
  openGraph: {
    type: "website",
    url: `${siteUrl}${PAGE_PATH}`,
    title: `${TITLE} — ${siteConfig.shortName}`,
    description: DESCRIPTION,
    siteName: siteConfig.shortName,
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — ${siteConfig.shortName}`,
    description: DESCRIPTION,
    images: [siteConfig.ogImage],
  },
};

function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: TILE_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Tile Calculator",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web)",
      url: `${siteUrl}${PAGE_PATH}`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Calculators", item: `${siteUrl}/calculators` },
        { "@type": "ListItem", position: 3, name: "Tile Calculator", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  ];
}

export default function TileCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
              Calculator
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tile Calculator — Floor, Wall, Adhesive &amp; Grout
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Enter the surface, the tile size, and pick a preset — we return
              tile count with wastage plus adhesive and grout. Handles both
              modern thin-set and traditional 20&nbsp;mm mortar bed.
            </p>
          </header>

          <section className="mb-16">
            <TileCalculatorForm initialStandards={TILE_STANDARDS} />
          </section>

          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">How the calculation works</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li>
                <strong>Net area</strong> = length × width − sum of excluded
                rectangles (columns, drains, pipe cutouts).
              </li>
              <li>
                <strong>Tile count (before wastage)</strong> = ⌈net area ÷ tile
                area⌉. Tiles are rounded up — you can&apos;t buy half a tile.
              </li>
              <li>
                <strong>Tile count (final)</strong> = ⌈count × (1 + wastage
                %)⌉. Default wastage is 10% — bump higher for diagonal or
                border-heavy layouts.
              </li>
              <li>
                <strong>Thin-set adhesive</strong> (kg) = net area ÷ coverage
                (sqm/kg). Or <strong>mortar bed</strong> (cum) = net area ×
                thickness, then cement:sand ratio splits it into bags + cft.
              </li>
              <li>
                <strong>Grout volume</strong> ≈ total joint length × joint
                width × joint depth. Joint depth defaults to the tile
                thickness (override in Customise if you only grout the top of
                the joint). Weight uses ~1500 kg/cum. Add 15–25% on top when
                actually buying grout — mixing waste is real.
              </li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {TILE_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
              Other calculators
            </h2>
            <CalculatorGrid filter={(c) => c.slug !== "tile"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
