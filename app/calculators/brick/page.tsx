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
const TITLE = "Brick Calculator — Bricks & Mortar for Wall, Patio, Paver, Fire Pit";
const DESCRIPTION =
  "Free brick calculator. Work out the exact number of bricks and the mortar (cement + sand) you need for any wall, patio, paver run, fire pit, retaining wall, or house. Supports red brick, fire brick, concrete brick, modular, traditional, and AAC block. Inputs by square feet or wall dimensions.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "brick calculator",
    "brick calculator wall",
    "brick calculator square feet",
    "brick calculator for wall",
    "brick calculator for house",
    "brick calculator patio",
    "brick calculator for patio",
    "paver brick calculator",
    "paving brick calculator",
    "fire pit brick calculator",
    "brick calculator for fire pit",
    "fire brick calculator",
    "retaining wall brick calculator",
    "red brick calculator",
    "concrete brick calculator",
    "wall brick calculator",
    "floor brick calculator",
    "mortar brick calculator",
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
 * JSON-LD — FAQPage + SoftwareApplication + BreadcrumbList.
 * Three schemas for max SERP eligibility.
 */
function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: BRICK_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Brick Calculator",
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
          name: "Brick Calculator",
          item: `${siteUrl}${PAGE_PATH}`,
        },
      ],
    },
  ];
}

export default function BrickCalculatorPage() {
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
              Brick Calculator — Wall, Patio, Paver &amp; Fire Pit
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Enter your wall&apos;s dimensions, a total square footage, or the
              volume you need to fill. We&apos;ll return the brick count,
              mortar volume, cement bags, and sand — matched to the brick you
              actually use, whether that&apos;s red clay brick, fire brick,
              concrete brick, modular, or an AAC block.
            </p>
          </header>

          {/* Calculator form + result. The form is the client island; everything
              around it stays on the server. */}
          <section className="mb-16">
            <BrickCalculatorForm initialStandards={BRICK_STANDARDS} />
          </section>

          {/* Use-case grid — hits patio, paver, fire pit, retaining wall,
              red brick, fire brick, concrete brick keywords with real prose. */}
          <section className="mb-16">
            <h2 className="text-lg font-semibold">
              What this brick calculator handles
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Brick wall</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Straight, corner, or partition wall — enter length, height,
                  and thickness. Doors and windows subtract from the area.
                  Returns bricks + mortar for a full wall.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Brick patio / paving</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  For a paver patio, switch to volume mode with a shallow
                  thickness (usually 2–3 inches for pavers). Returns the paver
                  brick count for the surface area.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Fire pit</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Circular fire pits: compute the ring circumference, multiply
                  by height and thickness, and enter as volume. Use the fire
                  brick preset — fire brick is thicker and takes fewer courses.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Retaining wall</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Retaining walls carry lateral load — thickness is usually
                  double a partition wall. Enter the real wall thickness and
                  the calculator handles the rest.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">Whole house</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Estimating a full house? Total your external wall length,
                  subtract doors and windows, and enter as one wall — you get
                  the full brick order in one calculation.
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h3 className="text-sm font-semibold">By square feet</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  Only have square footage? Enter length × 1 ft and set the
                  height to your area ÷ length. Or use the volume mode with
                  area × wall thickness.
                </p>
              </div>
            </div>
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
