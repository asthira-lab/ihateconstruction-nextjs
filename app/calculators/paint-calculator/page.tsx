/**
 * /calculators/paint-calculator — Server Component.
 *
 * Owns page metadata, static content (H1, intro, formula card, FAQ,
 * JSON-LD schema), and the initial standards data that seeds the client
 * form. The calculation itself lives in the Server Action; the interactive
 * form is a client island.
 */

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { PAINT_FAQ, PAINT_STANDARDS } from "@/features/calculators/paint";
import { PaintCalculatorForm } from "./PaintCalculatorForm";

const PAGE_PATH = "/calculators/paint-calculator";
const TITLE = "Paint Calculator — Interior, Exterior & Room";
const DESCRIPTION =
  "Free paint calculator. Enter room dimensions or wall area and get the exact litres of paint you need for interior emulsion, exterior emulsion, enamel, primer, and putty. Handles multiple coats, ceilings, doors, and windows.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "paint calculator",
    "paint calculator for room",
    "paint calculator for house",
    "wall paint calculator",
    "interior paint calculator",
    "exterior paint calculator",
    "paint litre calculator",
    "paint quantity calculator",
    "primer calculator",
    "putty calculator",
    "coverage per litre",
    "interior emulsion calculator",
    "exterior emulsion calculator",
    "how much paint do I need",
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
      mainEntity: PAINT_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Paint Calculator",
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
        { "@type": "ListItem", position: 3, name: "Paint Calculator", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  ];
}

export default function PaintCalculatorPage() {
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
              Paint Calculator — Litres for Interior &amp; Exterior Walls
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Enter a room or a total area, pick your paint products, and
              we&apos;ll return the litres you need — per layer and in total.
              Handles primer under emulsion, multiple coats, and per-layer
              coverage overrides.
            </p>
          </header>

          <section className="mb-16">
            <PaintCalculatorForm initialStandards={PAINT_STANDARDS} />
          </section>

          {/* Formula card */}
          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">How the calculation works</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li>
                <strong>Wall area</strong> = 2 × (length + width) × height. If
                you tick &quot;include ceiling,&quot; length × width is added on
                top.
              </li>
              <li>
                <strong>Openings</strong> (doors and windows) are subtracted
                rectangularly to give the net paintable area.
              </li>
              <li>
                For each layer, <strong>area covered</strong> = net area ×
                number of coats. Two coats on 60 sqm means painting 120 sqm.
              </li>
              <li>
                <strong>Litres before wastage</strong> = area covered ÷
                coverage per litre (12 sqm/L for interior emulsion by default).
              </li>
              <li>
                <strong>Litres</strong> = litres before wastage × (1 + wastage
                %). Default wastage is 5–7% depending on the paint type — bump
                it for rough or absorbent surfaces.
              </li>
              <li>
                Totals across layers give the full paint order for the job.
              </li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {PAINT_FAQ.map((item) => (
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
            <CalculatorGrid filter={(c) => c.slug !== "paint-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
