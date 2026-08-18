// /calculators/brick-calculator — Server Component. Locale-aware shell; SEO body stays English.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { BRICK_FAQ, BRICK_STANDARDS } from "@/features/calculators/brick";
import { BrickCalculatorForm } from "./BrickCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/calculators/brick-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.brick.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["brick calculator", "brick calculator wall", "brick calculator square feet", "brick calculator for wall", "brick calculator for house", "brick calculator patio", "brick calculator for patio", "paver brick calculator", "paving brick calculator", "fire pit brick calculator", "brick calculator for fire pit", "fire brick calculator", "retaining wall brick calculator", "red brick calculator", "concrete brick calculator", "wall brick calculator", "floor brick calculator", "mortar brick calculator", "bricks required for wall", "cement sand mortar calculator", "AAC block calculator", "modular brick calculator India"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, crumb: string, home: string, calcs: string) {
  return [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: BRICK_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: title, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web)", url: `${siteUrl}/${locale}${PAGE_PATH}`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: calcs, item: `${siteUrl}/${locale}/calculators` },
      { "@type": "ListItem", position: 3, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
    ] },
  ];
}

export default async function BrickCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.brick;
  const c = dict.calculators.common;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, t.title, t.meta.description, t.crumb, dict.breadcrumbs.home, dict.breadcrumbs.calculators)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">{c.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">{t.subtitle}</p>
          </header>

          <section className="mb-16">
            <BrickCalculatorForm
              initialStandards={BRICK_STANDARDS}
              t={t.form}
              common={dict.common}
              cCommon={c}
            />
          </section>

          {/* Use-case + formula + FAQ — kept in English; construction terms don't translate cleanly. */}
          <section className="mb-16">
            <h2 className="text-lg font-semibold">What this brick calculator handles</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10"><h3 className="text-sm font-semibold">Brick wall</h3><p className="mt-1 text-sm text-black/70 dark:text-white/70">Straight, corner, or partition wall — enter length, height, and thickness. Doors and windows subtract from the area. Returns bricks + mortar for a full wall.</p></div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10"><h3 className="text-sm font-semibold">Brick patio / paving</h3><p className="mt-1 text-sm text-black/70 dark:text-white/70">For a paver patio, switch to volume mode with a shallow thickness (usually 2–3 inches for pavers). Returns the paver brick count for the surface area.</p></div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10"><h3 className="text-sm font-semibold">Fire pit</h3><p className="mt-1 text-sm text-black/70 dark:text-white/70">Circular fire pits: compute the ring circumference, multiply by height and thickness, and enter as volume. Use the fire brick preset — fire brick is thicker and takes fewer courses.</p></div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10"><h3 className="text-sm font-semibold">Retaining wall</h3><p className="mt-1 text-sm text-black/70 dark:text-white/70">Retaining walls carry lateral load — thickness is usually double a partition wall. Enter the real wall thickness and the calculator handles the rest.</p></div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10"><h3 className="text-sm font-semibold">Whole house</h3><p className="mt-1 text-sm text-black/70 dark:text-white/70">Estimating a full house? Total your external wall length, subtract doors and windows, and enter as one wall — you get the full brick order in one calculation.</p></div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10"><h3 className="text-sm font-semibold">By square feet</h3><p className="mt-1 text-sm text-black/70 dark:text-white/70">Only have square footage? Enter length × 1 ft and set the height to your area ÷ length. Or use the volume mode with area × wall thickness.</p></div>
            </div>
          </section>

          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">{c.how}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li><strong>Masonry volume</strong> = wall length × height × thickness, with openings (doors, windows) subtracted from the wall area first. In volume mode this is the number you provide.</li>
              <li><strong>Nominal brick volume</strong> = (brick length + joint) × (brick width + joint) × (brick height + joint). This is what one brick actually consumes on the wall, mortar and all.</li>
              <li><strong>Bricks required</strong> = masonry volume ÷ nominal brick volume, rounded up. Wastage percentage is then added on top.</li>
              <li><strong>Mortar volume</strong> = masonry volume − (bricks × actual brick volume). Multiplied by (1 + mortar wastage %) and then by 1.33 to convert wet volume to dry.</li>
              <li><strong>Cement and sand</strong> split from the dry mortar by the ratio (default 1:6). Cement converts to 50 kg bags; sand converts to cubic feet.</li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">{c.faq}</h2>
            <dl className="space-y-6">
              {BRICK_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">{c.other}</h2>
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(c) => c.slug !== "brick-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
