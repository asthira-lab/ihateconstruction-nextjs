// /calculators/steel-calculator — Server Component. Locale-aware shell.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { STEEL_FAQ, STEEL_STANDARDS } from "@/features/calculators/steel";
import { SteelCalculatorForm } from "./SteelCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/calculators/steel-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.steel.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["steel calculator", "steel weight calculator", "TMT bar weight calculator", "reinforcement calculator", "rebar weight calculator", "steel bar calculator", "D squared by 162", "d2 by 162 formula", "thumb rule steel calculator", "IS 1786 calculator", "Fe 500 calculator", "Fe 550 calculator", "RCC steel weight", "bar schedule calculator", "steel for slab calculator", "steel for column calculator", "steel for beam calculator"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, crumb: string, home: string, calcs: string) {
  return [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: STEEL_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: title, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web)", url: `${siteUrl}/${locale}${PAGE_PATH}`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: calcs, item: `${siteUrl}/${locale}/calculators` },
      { "@type": "ListItem", position: 3, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
    ] },
  ];
}

export default async function SteelCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.steel;
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
            <SteelCalculatorForm
              initialStandards={STEEL_STANDARDS}
              t={t.form}
              common={dict.common}
              cCommon={c}
            />
          </section>

          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">{c.how}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li><strong>Weight per metre</strong> = D² / 162 kg/m, where D is the bar diameter in mm. Comes from π × (D/2)² × 7850 kg/cum ÷ 10⁶ — the standard site shortcut.</li>
              <li><strong>Total length</strong> for each bar row = length × count. Cutting length includes hooks / bends if you enter it that way; laps and chairs aren&apos;t modeled separately.</li>
              <li><strong>Weight per row</strong> = weight per metre × total length. Sum across rows for the total before wastage.</li>
              <li><strong>Wastage</strong> (default 3%) is added on top for cutting waste and small oversights.</li>
              <li><strong>Thumb rule</strong> mode multiplies concrete volume by a kg/cum rate that depends on the member (80 for slabs, 100 for beams, 130 for columns, 70 for footings, 130 for staircases). Rough — ±20% — use only for pricing, not procurement.</li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">{c.faq}</h2>
            <dl className="space-y-6">
              {STEEL_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">{c.other}</h2>
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(c) => c.slug !== "steel-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
