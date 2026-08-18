// /calculators/concrete-calculator — Server Component. Locale-aware shell.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { CONCRETE_FAQ, CONCRETE_STANDARDS } from "@/features/calculators/concrete";
import { ConcreteCalculatorForm } from "./ConcreteCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/calculators/concrete-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.concrete.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["concrete calculator", "concrete calculator for slab", "concrete calculator yards", "concrete calculator cubic yards", "concrete calculator bags", "cement sand aggregate calculator", "M15 concrete calculator", "M20 concrete calculator", "M25 concrete calculator", "concrete mix ratio calculator India", "PCC calculator", "RCC calculator", "ready mix concrete calculator", "concrete slab calculator", "footing concrete calculator", "column concrete calculator", "beam concrete calculator"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, crumb: string, home: string, calcs: string) {
  return [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: CONCRETE_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: title, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web)", url: `${siteUrl}/${locale}${PAGE_PATH}`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: calcs, item: `${siteUrl}/${locale}/calculators` },
      { "@type": "ListItem", position: 3, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
    ] },
  ];
}

export default async function ConcreteCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.concrete;
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
            <ConcreteCalculatorForm
              initialStandards={CONCRETE_STANDARDS}
              t={t.form}
              common={dict.common}
              cCommon={c}
            />
          </section>

          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">{c.how}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li><strong>Dry volume</strong> = wet volume × 1.54. The dry-to-wet factor accounts for the shrinkage that happens when dry ingredients combine into wet concrete.</li>
              <li><strong>Wastage</strong> is applied uniformly to all three components (default 3%). Dry volume × (1 + wastage %).</li>
              <li><strong>Split by mix ratio</strong> a : b : c. For M20 (1:1.5:3), cement takes 1/5.5 of the total, sand takes 1.5/5.5, and aggregate takes 3/5.5.</li>
              <li><strong>Cement bags</strong> = cement volume × 1440 kg/cum ÷ 50 kg/bag, rounded up to the next whole bag.</li>
              <li><strong>Sand &amp; aggregate</strong> are quoted in whichever unit you select — cft (default in India), cubic meters, or kilograms using standard bulk densities.</li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">{c.faq}</h2>
            <dl className="space-y-6">
              {CONCRETE_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">{c.other}</h2>
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(c) => c.slug !== "concrete-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
