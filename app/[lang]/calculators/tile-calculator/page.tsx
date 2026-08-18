// /calculators/tile-calculator — Server Component. Locale-aware shell.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { TILE_FAQ, TILE_STANDARDS } from "@/features/calculators/tile";
import { TileCalculatorForm } from "./TileCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/calculators/tile-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.tile.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["tile calculator", "floor tile calculator", "wall tile calculator", "how many tiles do I need", "tile calculator square feet", "tile adhesive calculator", "grout calculator", "vitrified tile calculator", "ceramic tile calculator", "bathroom tile calculator", "kitchen tile calculator", "thin-set adhesive calculator", "mortar bed tile calculator India", "tile count calculator"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, crumb: string, home: string, calcs: string) {
  return [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: TILE_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: title, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web)", url: `${siteUrl}/${locale}${PAGE_PATH}`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: calcs, item: `${siteUrl}/${locale}/calculators` },
      { "@type": "ListItem", position: 3, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
    ] },
  ];
}

export default async function TileCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.tile;
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
            <TileCalculatorForm
              initialStandards={TILE_STANDARDS}
              t={t.form}
              common={dict.common}
              cCommon={c}
            />
          </section>

          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">{c.how}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li><strong>Net area</strong> = length × width − sum of excluded rectangles (columns, drains, pipe cutouts).</li>
              <li><strong>Tile count (before wastage)</strong> = ⌈net area ÷ tile area⌉. Tiles are rounded up — you can&apos;t buy half a tile.</li>
              <li><strong>Tile count (final)</strong> = ⌈count × (1 + wastage %)⌉. Default wastage is 10% — bump higher for diagonal or border-heavy layouts.</li>
              <li><strong>Thin-set adhesive</strong> (kg) = net area ÷ coverage (sqm/kg). Or <strong>mortar bed</strong> (cum) = net area × thickness, then cement:sand ratio splits it into bags + cft.</li>
              <li><strong>Grout volume</strong> ≈ total joint length × joint width × joint depth. Joint depth defaults to the tile thickness (override in Customise if you only grout the top of the joint). Weight uses ~1500 kg/cum. Add 15–25% on top when actually buying grout — mixing waste is real.</li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">{c.faq}</h2>
            <dl className="space-y-6">
              {TILE_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">{c.other}</h2>
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(c) => c.slug !== "tile-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
