// About page — dict-driven, locale-aware.
import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/about";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.about.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["about ihateconstruction", "construction management software India", "contractor software India", "construction calculator app"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: `${t.title} — ${siteConfig.shortName}`, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: `${t.title} — ${siteConfig.shortName}`, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, homeCrumb: string, aboutCrumb: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: title,
    url: `${siteUrl}/${locale}${PAGE_PATH}`,
    description,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeCrumb, item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: aboutCrumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
      ],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.about;
  const meta = t.meta;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, meta.title, meta.description, dict.breadcrumbs.home, dict.breadcrumbs.about)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>

          <div className="prose prose-sm mt-8 max-w-none dark:prose-invert">
            <h2>{t.problem.heading}</h2>
            <p>{t.problem.body}</p>
            <p>{t.problem.intro}</p>
            <ul>
              {t.problem.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>

            <h2>{t.solution.heading}</h2>
            <p>{t.solution.body}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 not-prose my-6">
              {(["calculators", "boq", "invoices", "pdf"] as const).map((k) => (
                <div key={k} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                  <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
                    {t.solution.cards[k].title}
                  </p>
                  <p className="mt-2 text-sm">{t.solution.cards[k].body}</p>
                </div>
              ))}
            </div>

            <h2>{t.audience.heading}</h2>
            <ul>
              {t.audience.items.map((it) => (
                <li key={it.bold}><strong>{it.bold}</strong>{it.rest}</li>
              ))}
            </ul>

            <h2>{t.india.heading}</h2>
            <p>{t.india.intro}</p>
            <ul>
              {t.india.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>

            <h2>{t.contact.heading}</h2>
            <p>
              {t.contact.body1}{" "}
              <a href={`mailto:${t.contact.email}`}>{t.contact.email}</a> {t.contact.body2}{" "}
              <a href={`/${locale}/contact`}>{t.contact.link}</a>.
            </p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
