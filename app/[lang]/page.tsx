// Homepage — Server Component. Loads dict once, passes slices down.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IndianSection } from "@/components/marketing/IndianSection";
import { ClosingCTA } from "@/components/marketing/ClosingCTA";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}`]));
  return { alternates: { canonical: `/${locale}`, languages: { ...languages, "x-default": "/en" } } };
}

function jsonLd(locale: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      alternateName: siteConfig.shortName,
      url: siteUrl,
      logo: `${siteUrl}${siteConfig.ogImage}`,
      description: siteConfig.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.shortName,
      url: siteUrl,
      inLanguage: locale,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/${locale}/calculators?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Construction calculators",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cement Calculator", url: `${siteUrl}/${locale}/calculators/cement-calculator` },
        { "@type": "ListItem", position: 2, name: "Concrete Calculator", url: `${siteUrl}/${locale}/calculators/concrete-calculator` },
        { "@type": "ListItem", position: 3, name: "Brick Calculator", url: `${siteUrl}/${locale}/calculators/brick-calculator` },
        { "@type": "ListItem", position: 4, name: "Steel Calculator", url: `${siteUrl}/${locale}/calculators/steel-calculator` },
        { "@type": "ListItem", position: 5, name: "Paint Calculator", url: `${siteUrl}/${locale}/calculators/paint-calculator` },
        { "@type": "ListItem", position: 6, name: "Tile Calculator", url: `${siteUrl}/${locale}/calculators/tile-calculator` },
      ],
    },
  ];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero dict={dict.home.hero} locale={locale} />
        <FeatureGrid dict={dict.home.features} comingLabel={dict.common.coming} />
        <HowItWorks dict={dict.home.howItWorks} />
        <IndianSection dict={dict.home.indian} />
        <ClosingCTA dict={dict.home.closing} locale={locale} />
      </main>
      <SiteFooter />
    </>
  );
}
