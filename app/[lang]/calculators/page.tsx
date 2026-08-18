// /calculators — index page. Server Component; dict-driven metadata + copy.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { CALCULATORS, calculatorHref } from "@/features/calculators/registry";
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
    keywords: ["construction calculator", "cement calculator", "concrete calculator", "brick calculator", "steel calculator", "paint calculator", "tile calculator", "free construction calculator", "building material calculator", "contractor calculator"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, home: string, crumb: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Construction calculators",
      itemListElement: CALCULATORS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `${siteUrl}${calculatorHref(c, locale)}`,
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

export default async function CalculatorsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.index;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, dict.breadcrumbs.home, dict.breadcrumbs.calculators)) }}
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

          <CalculatorGrid locale={locale} comingLabel={dict.common.coming} />

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
