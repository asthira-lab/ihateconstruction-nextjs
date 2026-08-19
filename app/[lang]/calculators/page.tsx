// /calculators — index page. Server Component; dict-driven metadata + copy.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorSearch } from "@/components/marketing/CalculatorSearch";
import {
  CALCULATORS,
  calculatorHref,
  type CalculatorCategory,
} from "@/features/calculators/registry";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/calculators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.index.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["construction calculator", "cement calculator", "concrete calculator", "concrete volume calculator", "concrete yard calculator", "brick calculator", "steel calculator", "rebar calculator", "paint calculator", "tile calculator", "free construction calculator", "building material calculator", "contractor calculator"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(
  locale: string,
  home: string,
  crumb: string,
  entries: Array<{ slug: string; title: string; href: string }>,
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Construction calculators",
      itemListElement: entries.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `${siteUrl}${c.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
      ],
    },
  ];
}

interface LocalizedEntry {
  slug: string;
  href: string;
  title: string;
  description: string;
  keywords: string[];
  status: "live" | "coming";
  category: CalculatorCategory;
}

export default async function CalculatorsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.index;

  const entries: LocalizedEntry[] = CALCULATORS.map((e) => {
    const calcDict = (dict.calculators as Record<string, { title?: string; meta?: { description?: string } }>)[e.slug];
    return {
      slug: e.slug,
      href: calculatorHref(e, locale),
      title: calcDict?.title ?? e.title,
      description: calcDict?.meta?.description ?? e.description,
      keywords: e.keywords ?? [],
      status: e.status,
      category: e.category,
    };
  });

  // Union of "all" plus the concrete category union, so the shape lines up with CalculatorSearch's prop.
  const categoryLabels = {
    all: t.categories.all,
    concrete: t.categories.concrete,
    masonry: t.categories.masonry,
    steel: t.categories.steel,
    finishes: t.categories.finishes,
    sitework: t.categories.sitework,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, dict.breadcrumbs.home, dict.breadcrumbs.calculators, entries)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <header className="mb-12 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
              {t.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 text-base text-black/70 dark:text-white/70">
              {t.subtitle}
            </p>
          </header>

          <CalculatorSearch
            entries={entries}
            locale={locale}
            comingLabel={dict.common.coming}
            placeholder={t.search.placeholder}
            emptyLabel={t.search.empty}
            clearLabel={t.search.clear}
            resultsLabelTemplate={t.search.results}
            suggestions={t.suggestions}
            suggestionsLabel={t.search.suggestionsLabel}
            categoriesLabel={t.search.categoriesLabel}
            categoryLabels={categoryLabels}
            ctaLabel={t.card.cta}
          />

          <p className="mt-12 text-xs text-black/50 dark:text-white/50">
            {t.missing}
            <span className="text-black/40 dark:text-white/40"> {t.contactSoon}</span>
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
