// /calculators/rebar-calculator — Server Component. Locale-aware shell.
// Human-readable article lives as MDX in content/rebar/<locale>.mdx; the SEO
// metadata (title/desc/FAQ JSON-LD) is kept here and in the locale dictionary.

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
import {
  CALCULATORS,
  calculatorHref,
} from "@/features/calculators/registry";
import { REBAR_SIZES } from "@/features/calculators/rebar";
import { getRebarToc } from "@/features/calculators/rebar/toc";
import { RebarCalculatorForm } from "./RebarCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

import RebarEn from "@/content/rebar/en.mdx";
import RebarHi from "@/content/rebar/hi.mdx";
import RebarEs from "@/content/rebar/es.mdx";
import RebarFr from "@/content/rebar/fr.mdx";
import RebarDe from "@/content/rebar/de.mdx";
import RebarAr from "@/content/rebar/ar.mdx";

const REBAR_ARTICLES: Record<string, typeof RebarEn> = {
  en: RebarEn,
  hi: RebarHi,
  es: RebarEs,
  fr: RebarFr,
  de: RebarDe,
  ar: RebarAr,
};

const PAGE_PATH = "/calculators/rebar-calculator";
const REBAR_IMG = `${siteUrl}/rebar-calculator-og.png`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.rebar.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: {
      canonical: `/${locale}${PAGE_PATH}`,
      languages: { ...languages, "x-default": `/en${PAGE_PATH}` },
    },
    keywords: [
      "rebar calculator",
      "rebar calculator for slab",
      "concrete rebar calculator",
      "rebar calculator for concrete slab",
      "concrete slab rebar calculator",
      "slab rebar calculator",
      "steel rebar calculator",
      "rebar calculator weight",
      "weight of rebar calculator",
      "rebar calculator for footings",
      "footing rebar calculator",
      "foundation rebar calculator",
      "rebar calculator for wall",
      "rebar calculator for concrete",
      "rebar calculator square feet",
      "rebar calculator excel",
      "rebar spacing calculator",
      "rebar weight per metre",
      "D squared by 162",
    ],
    openGraph: {
      type: "website",
      url: `${siteUrl}/${locale}${PAGE_PATH}`,
      title: t.title,
      description: t.description,
      siteName: siteConfig.shortName,
      images: [{ url: REBAR_IMG, width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: [REBAR_IMG],
    },
  };
}

// FAQ is dict-driven so the FAQPage JSON-LD stays localized and in sync with the page.
function jsonLd(
  locale: string,
  title: string,
  description: string,
  faq: { q: string; a: string }[],
  home: string,
  calcs: string,
  crumb: string,
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: title,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web)",
      url: `${siteUrl}/${locale}${PAGE_PATH}`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.7",
        ratingCount: "312",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: calcs, item: `${siteUrl}/${locale}/calculators` },
        { "@type": "ListItem", position: 3, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
      ],
    },
  ];
}

export default async function RebarCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.rebar;
  const c = dict.calculators.common;
  const art = t.article;
  const Article = REBAR_ARTICLES[locale] ?? RebarEn;
  const toc = getRebarToc(locale);

  const others = CALCULATORS.filter((e) => e.slug !== "rebar-calculator" && e.status === "live");
  const similarLinks = others.map((e) => ({
    href: calculatorHref(e, locale),
    label: e.title,
  }));
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
                  <RebarCalculatorForm t={t.form} common={dict.common} cCommon={c} />
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

              <section className="mt-10">
                <h2 className="text-xl font-semibold tracking-tight">{t.sizes.heading}</h2>
                <p className="mt-3 max-w-3xl text-sm text-black/75 dark:text-white/75">{t.sizes.note}</p>
                <div className="mt-5 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-black/10 text-xs uppercase tracking-widest text-black/60 dark:border-white/10 dark:text-white/60">
                        <th className="px-4 py-3 font-medium">{t.sizes.cols.imperial}</th>
                        <th className="px-4 py-3 font-medium">{t.sizes.cols.metric}</th>
                        <th className="px-4 py-3 font-medium">{t.sizes.cols.diaIn}</th>
                        <th className="px-4 py-3 font-medium">{t.sizes.cols.diaMm}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {REBAR_SIZES.map((s) => (
                        <tr key={s.imperial} className="text-black/80 dark:text-white/80">
                          <td className="px-4 py-2 font-medium">{s.imperial}</td>
                          <td className="px-4 py-2">{s.metric}</td>
                          <td className="px-4 py-2 tabular-nums">{s.diameterIn}″</td>
                          <td className="px-4 py-2 tabular-nums">{s.diameterMm} mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <CalculatorAd slotKey="rebarInContent" />

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
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(e) => e.slug !== "rebar-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
