// Privacy Policy page — dict-driven, locale-aware.
import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/privacy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).privacy.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    robots: { index: true, follow: true },
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: `${t.title} — ${siteConfig.shortName}`, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: `${t.title} — ${siteConfig.shortName}`, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, home: string, crumb: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: `${siteUrl}/${locale}${PAGE_PATH}`,
    description,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: home, item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: crumb, item: `${siteUrl}/${locale}${PAGE_PATH}` },
      ],
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.privacy;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, t.meta.title, t.meta.description, dict.breadcrumbs.home, dict.breadcrumbs.privacy)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">{t.updated}</p>

          <div className="prose prose-sm mt-8 max-w-none dark:prose-invert">
            <h2>{t.s1.heading}</h2>
            <p>{t.s1.intro}</p>
            <ul>
              {t.s1.items.map((it) => (
                <li key={it.bold}><strong>{it.bold}</strong> {it.rest}</li>
              ))}
            </ul>

            <h2>{t.s2.heading}</h2>
            <ul>
              {t.s2.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>

            <h2>{t.s3.heading}</h2>
            <p>{t.s3.body}</p>

            <h2>{t.s4.heading}</h2>
            <p>{t.s4.intro}</p>
            <ul>
              {t.s4.items.map((it) => (
                <li key={it.bold}><strong>{it.bold}</strong> {it.rest}</li>
              ))}
            </ul>

            <h2>{t.s5.heading}</h2>
            <ul>
              {t.s5.items.map((it) => (
                <li key={it.bold}><strong>{it.bold}</strong> {it.rest}</li>
              ))}
            </ul>

            <h2>{t.s6.heading}</h2>
            <p>{t.s6.body}</p>

            <h2>{t.s7.heading}</h2>
            <p>{t.s7.body}</p>

            <h2>{t.s8.heading}</h2>
            <p>{t.s8.body}</p>

            <h2>{t.s9.heading}</h2>
            <p>{t.s9.body}</p>

            <h2>{t.s10.heading}</h2>
            <p>{t.s10.body} <a href={`mailto:${t.s10.email}`}>{t.s10.email}</a></p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
