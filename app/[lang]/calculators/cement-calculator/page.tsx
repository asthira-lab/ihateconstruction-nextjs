// /calculators/cement-calculator — Server Component. Locale-aware shell; SEO body stays English.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { CalculatorGrid } from "@/components/marketing/CalculatorGrid";
import { CEMENT_FAQ } from "@/features/calculators/cement";
import { CementCalculatorForm } from "./CementCalculatorForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/calculators/cement-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).calculators.cement.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["cement calculator", "cement calculator for slab", "cement calculator bags", "cement calculator for concrete", "portland cement calculator", "cement calculator yards", "sand and cement calculator", "bags of cement calculator", "how much cement calculator", "bag cement calculator", "cubic yard cement calculator", "94 lb portland cement calculator", "post hole cement calculator", "yards of cement calculator", "how many bags of cement", "cement bag calculator India", "cement bags for slab"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: t.title, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, crumb: string, home: string, calcs: string) {
  return [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: CEMENT_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: title, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web)", url: `${siteUrl}/${locale}${PAGE_PATH}`, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: calcs, item: `${siteUrl}/${locale}/calculators` },
      { "@type": "ListItem", position: 3, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
    ] },
  ];
}

export default async function CementCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.calculators.cement;
  const c = dict.calculators.common;
  const cards = t.cards;
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
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
              {c.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              {t.subtitle}
            </p>
          </header>

          <section className="mb-16">
            <CementCalculatorForm t={t.form} common={dict.common} />
          </section>

          <section className="mb-16">
            <h2 className="text-lg font-semibold">{t.handles}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["slab", "post", "cuyd", "sc", "portland", "indian"] as const).map((k) => (
                <div key={k} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                  <h3 className="text-sm font-semibold">{cards[k].title}</h3>
                  <p className="mt-1 text-sm text-black/70 dark:text-white/70">{cards[k].body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Formula + FAQ — kept in English; construction formulas don't translate cleanly. */}
          <section className="mb-16 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <h2 className="text-lg font-semibold">How the cement calculation works</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-black/75 dark:text-white/75">
              <li><strong>Wet volume</strong> is calculated from your inputs — a slab is length × width × thickness, a post hole is π × r² × depth × count, or you enter volume directly in cubic yards.</li>
              <li><strong>Dry volume</strong> = wet volume × 1.54. Dry cement, sand, and aggregate lose volume when mixed into wet concrete; 1.54 is the standard multiplier.</li>
              <li><strong>Wastage</strong> is added uniformly (default 5%). Bump to 8–10% for tricky pours or hand-mixed work.</li>
              <li><strong>Mix split</strong> by ratio — for M20 (1:1.5:3), cement is 1/5.5 of dry volume, sand is 1.5/5.5, aggregate is 3/5.5. Sand-only ratios (1:3, 1:4, 1:6) skip the aggregate.</li>
              <li><strong>Cement bags</strong> = cement volume × 1440 kg/m³ ÷ bag weight, rounded up to whole bags. Bag weight follows your selection — 94 lb Portland, 50 kg, 40 kg, 60 lb, 80 lb, or 25 kg.</li>
            </ol>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 text-lg font-semibold">{c.faq}</h2>
            <dl className="space-y-6">
              {CEMENT_FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="text-sm font-semibold">{item.question}</dt>
                  <dd className="mt-1 text-sm text-black/70 dark:text-white/70">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-black/10 pt-10 dark:border-white/10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
              {c.other}
            </h2>
            <CalculatorGrid locale={locale} comingLabel={dict.common.coming} filter={(c) => c.slug !== "cement-calculator"} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
