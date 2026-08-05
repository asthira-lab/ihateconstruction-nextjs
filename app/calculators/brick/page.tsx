/**
 * /calculators/brick — Server Component.
 *
 * Owns page metadata, static content (H1, intro, FAQ, JSON-LD schema), and
 * the initial standards data that seeds the client form. The calculation
 * itself lives in the Server Action; the interactive form is a client island.
 */

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { BRICK_FAQ, BRICK_STANDARDS } from "@/features/calculators/brick";
import { BrickCalculatorForm } from "./BrickCalculatorForm";

const PAGE_PATH = "/calculators/brick";
const TITLE = "Brick Calculator";
const DESCRIPTION =
  "Calculate the exact number of bricks and the mortar (cement + sand) you need for any wall. Supports modular, traditional, and AAC block standards used across India. Free, unit-aware, GST-ready contractor tool.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "brick calculator",
    "bricks required for wall",
    "cement sand mortar calculator",
    "AAC block calculator",
    "modular brick calculator India",
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

/**
 * JSON-LD FAQPage schema — surfaces the FAQ answers as rich results in Google.
 * Keep in sync with BRICK_FAQ; the answer text should be plain prose.
 */
function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BRICK_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default function BrickCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
              Calculator
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {TITLE}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Enter your wall&apos;s dimensions or the total volume you need to fill.
              We&apos;ll return the brick count, mortar volume, cement bags, and sand —
              matched to the brick standard you&apos;re using.
            </p>
          </header>

          {/* Calculator form + result. The form is the client island; everything
              around it stays on the server. */}
          <section className="mb-16">
            <BrickCalculatorForm initialStandards={BRICK_STANDARDS} />
          </section>

          {/* Formula card */}
          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">How the calculation works</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li>
                <strong>Masonry volume</strong> = wall length × height × thickness, with
                openings (doors, windows) subtracted from the wall area first. In volume
                mode this is the number you provide.
              </li>
              <li>
                <strong>Nominal brick volume</strong> = (brick length + joint) × (brick width + joint) × (brick height + joint).
                This is what one brick actually consumes on the wall, mortar and all.
              </li>
              <li>
                <strong>Bricks required</strong> = masonry volume ÷ nominal brick volume,
                rounded up. Wastage percentage is then added on top.
              </li>
              <li>
                <strong>Mortar volume</strong> = masonry volume − (bricks × actual brick
                volume). Multiplied by (1 + mortar wastage %) and then by 1.33 to convert
                wet volume to dry.
              </li>
              <li>
                <strong>Cement and sand</strong> split from the dry mortar by the ratio
                (default 1:6). Cement converts to 50 kg bags; sand converts to cubic feet.
              </li>
            </ol>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">Frequently asked questions</h2>
            <dl className="space-y-6">
              {BRICK_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Related calculators — reuses the shared registry so this stays
              in sync with /calculators automatically as new ones ship. */}
          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
              Other calculators
            </h2>
            <CalculatorGrid filter={(c) => c.slug !== "brick"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
