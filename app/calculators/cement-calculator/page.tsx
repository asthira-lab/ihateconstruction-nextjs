// /calculators/cement-calculator — server component. Metadata + static SEO copy + form island.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { CEMENT_FAQ } from "@/features/calculators/cement";
import { CementCalculatorForm } from "./CementCalculatorForm";

const PAGE_PATH = "/calculators/cement-calculator";
const TITLE = "Cement Calculator — Slab, Post Hole & Cubic Yards";
const DESCRIPTION =
  "Free cement calculator. Work out how many bags of cement you need for a concrete slab, post hole, wall, or any volume — in cubic yards, cubic feet, or cubic metres. Supports 94 lb Portland, 50 kg, 40 kg, 60 lb, and 80 lb bags, sand and cement mixes (1:3, 1:4, 1:6), and standard slab mixes (M15, M20, M25).";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "cement calculator",
    "cement calculator for slab",
    "cement calculator bags",
    "cement calculator for concrete",
    "portland cement calculator",
    "cement calculator yards",
    "sand and cement calculator",
    "bags of cement calculator",
    "how much cement calculator",
    "bag cement calculator",
    "cubic yard cement calculator",
    "94 lb portland cement calculator",
    "post hole cement calculator",
    "yards of cement calculator",
    "how many bags of cement",
    "cement bag calculator India",
    "cement bags for slab",
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

// FAQ + SoftwareApplication + BreadcrumbList. Three schemas for maximum
// eligibility (rich result, tool card, breadcrumb strip in SERP).
function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: CEMENT_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Cement Calculator",
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
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Calculators",
          item: `${siteUrl}/calculators`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Cement Calculator",
          item: `${siteUrl}${PAGE_PATH}`,
        },
      ],
    },
  ];
}

export default function CementCalculatorPage() {
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
              Cement Calculator
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Work out exactly how many bags of cement you need — for a concrete
              slab, a set of post holes, or any wet volume in cubic yards, cubic
              feet, or cubic metres. Supports 94 lb Portland cement bags, 50 kg
              Indian bags, 40 kg, 60 lb, and 80 lb bags, plus sand-and-cement
              mixes (1:3, 1:4, 1:6) and standard concrete mixes (M15, M20, M25).
            </p>
          </header>

          <section className="mb-16">
            <CementCalculatorForm />
          </section>

          {/* Use-case grid — hits the long-tail keywords with real content. */}
          <section className="mb-16">
            <h2 className="text-lg font-semibold">
              What this cement calculator handles
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Cement for a slab</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Enter length, width, and thickness in feet and inches. The
                  calculator returns bags of cement for M15, M20, or M25 mix —
                  the three grades used for driveways, garage floors, and house
                  slabs.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Post hole cement</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Fence posts, mailboxes, sign posts. Enter hole diameter,
                  depth, and how many posts you&apos;re setting; the tool sizes
                  a 1:3 sand-and-cement fill for the full run.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">
                  Cubic yards of cement
                </h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Already know your volume in cubic yards? Switch to Free
                  volume mode. Cubic metres and cubic feet also supported — the
                  calculator converts between all three.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Sand and cement</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Pick the 1:4 plaster, 1:6 brickwork, or 1:3 rich mortar preset
                  when you&apos;re only mixing cement with sand — no aggregate.
                  Output shows both bags of cement and cubic feet of sand.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">
                  94 lb Portland cement bags
                </h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  US contractors buying Type I/II Portland cement in 94 lb
                  bags: pick that bag size and the total rounds up to whole
                  bags automatically.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Indian 50 kg bags</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  For contractors in India: 50 kg OPC / PPC bags, IS 456 mix
                  ratios, and results in cubic feet — the units your godown
                  actually quotes.
                </p>
              </div>
            </div>
          </section>

          {/* Formula card — text Google can crawl. */}
          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">
              How the cement calculation works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li>
                <strong>Wet volume</strong> is calculated from your inputs — a
                slab is length × width × thickness, a post hole is π × r² ×
                depth × count, or you enter volume directly in cubic yards.
              </li>
              <li>
                <strong>Dry volume</strong> = wet volume × 1.54. Dry cement,
                sand, and aggregate lose volume when mixed into wet concrete;
                1.54 is the standard multiplier.
              </li>
              <li>
                <strong>Wastage</strong> is added uniformly (default 5%). Bump
                to 8–10% for tricky pours or hand-mixed work.
              </li>
              <li>
                <strong>Mix split</strong> by ratio — for M20 (1:1.5:3),
                cement is 1/5.5 of dry volume, sand is 1.5/5.5, aggregate is
                3/5.5. Sand-only ratios (1:3, 1:4, 1:6) skip the aggregate.
              </li>
              <li>
                <strong>Cement bags</strong> = cement volume × 1440 kg/m³ ÷ bag
                weight, rounded up to whole bags. Bag weight follows your
                selection — 94 lb Portland, 50 kg, 40 kg, 60 lb, 80 lb, or 25
                kg.
              </li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {CEMENT_FAQ.map((item) => (
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
            <CalculatorGrid filter={(c) => c.slug !== "cement-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
