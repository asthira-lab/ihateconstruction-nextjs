// /calculators/tile-calculator — Server Component. Locale-aware shell.
// Human-readable article lives as MDX in content/tile/<locale>.mdx.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { ArticleHeader } from "@/components/calculators/ui/ArticleHeader";
import { CalculatorPageShell } from "@/components/calculators/ui/CalculatorPageShell";
import { TableOfContents } from "@/components/calculators/ui/TableOfContents";
import { SimilarCalculators } from "@/components/calculators/ui/SimilarCalculators";
import { RelatedCalculators } from "@/components/calculators/ui/RelatedCalculators";
import { CalculatorAd } from "@/components/ads/CalculatorAd";
import { getToc } from "@/features/calculators/toc";
import { CALCULATORS, calculatorHref } from "@/features/calculators/registry";
import { TILE_STANDARDS } from "@/features/calculators/tile";
import { TileCalculatorForm } from "./TileCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

import TileEn from "@/content/tile/en.mdx";
import TileHi from "@/content/tile/hi.mdx";
import TileEs from "@/content/tile/es.mdx";
import TileFr from "@/content/tile/fr.mdx";
import TileDe from "@/content/tile/de.mdx";
import TileAr from "@/content/tile/ar.mdx";

const TILE_ARTICLES: Record<string, typeof TileEn> = {
  en: TileEn,
  hi: TileHi,
  es: TileEs,
  fr: TileFr,
  de: TileDe,
  ar: TileAr,
};

const getTileToc = getToc("tile");

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

function jsonLd(locale: string, title: string, description: string, faq: { q: string; a: string }[], home: string, calcs: string, crumb: string) {
  return [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
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
  const art = t.article;
  const Article = TILE_ARTICLES[locale] ?? TileEn;
  const toc = getTileToc(locale);

  const others = CALCULATORS.filter((e) => e.slug !== "tile-calculator" && e.status === "live");
  const similarLinks = others.map((e) => ({ href: calculatorHref(e, locale), label: e.title }));
  const relatedLinks = similarLinks.slice(0, 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLd(locale, t.title, t.meta.description, t.faq, dict.breadcrumbs.home, dict.breadcrumbs.calculators, t.crumb),
          ),
        }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <ArticleHeader eyebrow={c.eyebrow} title={t.title} subtitle={t.subtitle} />

          <div className="mt-10">
            <CalculatorPageShell
              calculator={
                <>
                  <TileCalculatorForm
                    initialStandards={TILE_STANDARDS}
                    t={t.form}
                    common={dict.common}
                    cCommon={c}
                  />
                  <SimilarCalculators title={c.other} links={similarLinks} />
                </>
              }
            >
              <TableOfContents title={art.toc} entries={toc} />

              <article
                aria-label={art.heading}
                className="prose prose-neutral mt-10 max-w-3xl prose-h2:text-xl prose-h2:font-semibold prose-h2:tracking-tight prose-p:text-black/75 prose-p:dark:text-white/75 prose-li:marker:text-black/50 dark:prose-invert"
              >
                <Article />
              </article>

              <CalculatorAd slotKey="tileInContent" />

              <section className="mt-10">
                <h2 className="text-xl font-semibold tracking-tight">{c.faq}</h2>
                <dl className="mt-6 max-w-3xl space-y-6">
                  {t.faq.map((item) => (
                    <div key={item.q}>
                      <dt className="text-sm font-semibold">{item.q}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-black/70 dark:text-white/70">
                        {item.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <div className="mt-10">
                <RelatedCalculators title={c.other} links={relatedLinks} />
              </div>
            </CalculatorPageShell>
          </div>

          <section className="mt-12 border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
              {c.other}
            </h2>
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(e) => e.slug !== "tile-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
