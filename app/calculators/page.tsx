/**
 * /calculators — the calculator index page.
 *
 * Server Component. Renders the 5-card grid from the shared registry.
 * Emits an `ItemList` JSON-LD block so Google can treat this as a category
 * page with rich list results.
 */

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { CALCULATORS, calculatorHref } from "@/features/calculators/registry";

const PAGE_PATH = "/calculators";
const TITLE = "Calculators";
const DESCRIPTION =
  "Free construction calculators — brick, concrete, steel, paint, and tile. Enter your job and get an exact material order in Indian units, ready to hand to your supplier.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
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
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Construction calculators",
    itemListElement: CALCULATORS.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      url: `${siteUrl}${calculatorHref(c)}`,
    })),
  };
}

export default function CalculatorsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <header className="mb-12 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
              Tools
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Calculators
            </h1>
            <p className="mt-4 text-base text-black/70 dark:text-white/70">
              Five construction calculators — enter your job, get an exact
              material list. Brick is live now; concrete, steel, paint, and tile
              are on the way.
            </p>
          </header>

          <CalculatorGrid />

          <p className="mt-12 text-xs text-black/50 dark:text-white/50">
            Missing a calculator you use daily?
            <span className="text-black/40 dark:text-white/40"> Contact form coming soon.</span>
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
