// /contact — Server Component. Owns metadata; passes dict slice to the client form.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "./ContactForm";
import { getDictionaryFor } from "@/app/[lang]/dictionaries";
import { isLocale, locales, defaultLocale } from "@/app/i18n-config";

const PAGE_PATH = "/contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = (await getDictionaryFor(locale)).contact.meta;
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${PAGE_PATH}`]));
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `/${locale}${PAGE_PATH}`, languages: { ...languages, "x-default": `/en${PAGE_PATH}` } },
    keywords: ["contact ihateconstruction", "construction calculator support", "contractor software support India", "feedback"],
    openGraph: { type: "website", url: `${siteUrl}/${locale}${PAGE_PATH}`, title: `${t.title} — ${siteConfig.shortName}`, description: t.description, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
    twitter: { card: "summary_large_image", title: `${t.title} — ${siteConfig.shortName}`, description: t.description, images: [siteConfig.ogImage] },
  };
}

function jsonLd(locale: string, title: string, description: string, home: string, crumb: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionaryFor(locale);
  const t = dict.contact;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, t.meta.title, t.meta.description, dict.breadcrumbs.home, dict.breadcrumbs.contact)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              {t.subtitle}
            </p>
          </header>

          <section className="mb-16">
            <ContactForm dict={t.form} />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
