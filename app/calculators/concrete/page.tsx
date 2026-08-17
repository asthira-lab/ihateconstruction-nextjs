/**
 * /calculators/concrete — Server Component.
 *
 * Owns page metadata, static content (H1, intro, formula card, FAQ, JSON-LD
 * schema), and the initial standards data that seeds the client form. The
 * calculation itself lives in the Server Action; the interactive form is a
 * client island.
 */

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import {
  CONCRETE_FAQ,
  CONCRETE_STANDARDS,
} from "@/features/calculators/concrete";
import { ConcreteCalculatorForm } from "./ConcreteCalculatorForm";

const PAGE_PATH = "/calculators/concrete";
const TITLE = "Concrete Calculator — Cement, Sand & Aggregate for Slab, Beam, Column";
const DESCRIPTION =
  "Free concrete calculator. Enter your slab, beam, column, or footing size and get cement bags, sand, and coarse aggregate — for M5 to M25 grades using the standard IS 456 mix ratios. Works in cubic yards, cubic feet, and cubic metres.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "concrete calculator",
    "concrete calculator for slab",
    "concrete calculator yards",
    "concrete calculator cubic yards",
    "concrete calculator bags",
    "cement sand aggregate calculator",
    "M15 concrete calculator",
    "M20 concrete calculator",
    "M25 concrete calculator",
    "concrete mix ratio calculator India",
    "PCC calculator",
    "RCC calculator",
    "ready mix concrete calculator",
    "concrete slab calculator",
    "footing concrete calculator",
    "column concrete calculator",
    "beam concrete calculator",
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

// FAQPage + SoftwareApplication + BreadcrumbList JSON-LD for max SERP surface.
function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: CONCRETE_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Concrete Calculator",
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
        {
          "@type": "ListItem",
          position: 2,
          name: "Calculators",
          item: `${siteUrl}/calculators`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Concrete Calculator",
          item: `${siteUrl}${PAGE_PATH}`,
        },
      ],
    },
  ];
}

export default function ConcreteCalculatorPage() {
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
              Concrete Calculator — Slab, Beam, Column &amp; Footing
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Enter the wet volume of concrete you need to pour, pick a grade,
              and we&apos;ll return cement bags, sand, and coarse aggregate —
              matched to the IS 456 mix ratio for that grade.
            </p>
          </header>

          <section className="mb-16">
            <ConcreteCalculatorForm initialStandards={CONCRETE_STANDARDS} />
          </section>

          {/* Formula card */}
          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">How the calculation works</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li>
                <strong>Dry volume</strong> = wet volume × 1.54. The dry-to-wet
                factor accounts for the shrinkage that happens when dry
                ingredients combine into wet concrete.
              </li>
              <li>
                <strong>Wastage</strong> is applied uniformly to all three
                components (default 3%). Dry volume × (1 + wastage %).
              </li>
              <li>
                <strong>Split by mix ratio</strong> a : b : c. For M20 (1:1.5:3),
                cement takes 1/5.5 of the total, sand takes 1.5/5.5, and
                aggregate takes 3/5.5.
              </li>
              <li>
                <strong>Cement bags</strong> = cement volume × 1440 kg/cum ÷ 50 kg/bag,
                rounded up to the next whole bag.
              </li>
              <li>
                <strong>Sand &amp; aggregate</strong> are quoted in whichever unit
                you select — cft (default in India), cubic meters, or kilograms
                using standard bulk densities.
              </li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {CONCRETE_FAQ.map((item) => (
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
            <CalculatorGrid filter={(c) => c.slug !== "concrete"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
