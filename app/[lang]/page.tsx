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
import { CALCULATORS, calculatorHref } from "@/features/calculators/registry";

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
      "@type": "ItemList",
      name: "Construction calculators",
      itemListElement: CALCULATORS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `${siteUrl}${calculatorHref(c, locale)}`,
      })),
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
        <FeatureGrid dict={dict.home.features} comingLabel={dict.common.coming} locale={locale} />
        <HowItWorks dict={dict.home.howItWorks} />
        <IndianSection dict={dict.home.indian} />
        <ClosingCTA dict={dict.home.closing} locale={locale} />
      </main>
      <SiteFooter />
    </>
  );
}
