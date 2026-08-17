// /calculators/steel-calculator — server component. Metadata + static content + form island.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { STEEL_FAQ, STEEL_STANDARDS } from "@/features/calculators/steel";
import { SteelCalculatorForm } from "./SteelCalculatorForm";

const PAGE_PATH = "/calculators/steel-calculator";
const TITLE = "Steel Calculator — TMT Bar Weight & Reinforcement";
const DESCRIPTION =
  "Free steel calculator. Enter your bar schedule or concrete volume and get the total weight of reinforcement steel in kg — for slabs, beams, columns, footings, and staircases. Uses D²/162, Fe 500 / Fe 550 TMT, IS 1786.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "steel calculator",
    "steel weight calculator",
    "TMT bar weight calculator",
    "reinforcement calculator",
    "rebar weight calculator",
    "steel bar calculator",
    "D squared by 162",
    "d2 by 162 formula",
    "thumb rule steel calculator",
    "IS 1786 calculator",
    "Fe 500 calculator",
    "Fe 550 calculator",
    "RCC steel weight",
    "bar schedule calculator",
    "steel for slab calculator",
    "steel for column calculator",
    "steel for beam calculator",
  ],
  openGraph: {
    type: "website",
    url: `${siteUrl}${PAGE_PATH}`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: siteConfig.shortName,
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [siteConfig.ogImage],
  },
};

function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: STEEL_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Steel Calculator",
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
        { "@type": "ListItem", position: 3, name: "Steel Calculator", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  ];
}

export default function SteelCalculatorPage() {
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
              Steel Calculator — TMT Bar Weight &amp; Reinforcement
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Two ways in — enter your bar schedule for an accurate weight, or
              enter concrete volume + member type for a quick thumb-rule
              estimate. Both use IS 1786 defaults; both are fully overridable.
            </p>
          </header>

          <section className="mb-16">
            <SteelCalculatorForm initialStandards={STEEL_STANDARDS} />
          </section>

          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">How the calculation works</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li>
                <strong>Weight per metre</strong> = D² / 162 kg/m, where D is
                the bar diameter in mm. Comes from π × (D/2)² × 7850 kg/cum
                ÷ 10⁶ — the standard site shortcut.
              </li>
              <li>
                <strong>Total length</strong> for each bar row = length ×
                count. Cutting length includes hooks / bends if you enter it
                that way; laps and chairs aren&apos;t modeled separately.
              </li>
              <li>
                <strong>Weight per row</strong> = weight per metre × total
                length. Sum across rows for the total before wastage.
              </li>
              <li>
                <strong>Wastage</strong> (default 3%) is added on top for
                cutting waste and small oversights.
              </li>
              <li>
                <strong>Thumb rule</strong> mode multiplies concrete volume by
                a kg/cum rate that depends on the member (80 for slabs, 100
                for beams, 130 for columns, 70 for footings, 130 for
                staircases). Rough — ±20% — use only for pricing, not
                procurement.
              </li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {STEEL_FAQ.map((item) => (
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
            <CalculatorGrid filter={(c) => c.slug !== "steel-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
