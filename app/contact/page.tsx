// /contact — Server Component. Owns metadata and the static shell; the form is a client island.

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "./ContactForm";

const PAGE_PATH = "/contact";
const TITLE = "Contact — Talk to the iHateConstruction Team";
const DESCRIPTION =
  "Contact iHateConstruction about bugs, features, calculator requests, partnerships, or general questions. One of us reads every message and usually replies within two business days.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "contact ihateconstruction",
    "construction calculator support",
    "contractor software support India",
    "feedback",
  ],
  openGraph: {
    type: "website",
    url: `${siteUrl}${PAGE_PATH}`,
    title: `${TITLE} — ${siteConfig.shortName}`,
    description: DESCRIPTION,
    siteName: siteConfig.shortName,
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — ${siteConfig.shortName}`,
    description: DESCRIPTION,
    images: [siteConfig.ogImage],
  },
};

// ContactPage + BreadcrumbList — gives Google a clean signal for the "Contact"
// entity and the site hierarchy.
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    url: `${siteUrl}${PAGE_PATH}`,
    description: DESCRIPTION,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Contact", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  };
}

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
              Company
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Contact us
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
              Write to us about a bug, a calculator you want built, a
              partnership, or anything else. One of us reads every message and
              usually replies within two business days.
            </p>
          </header>

          <section className="mb-16">
            <ContactForm />
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
