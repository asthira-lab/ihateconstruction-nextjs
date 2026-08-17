/**
 * Homepage — Server Component.
 *
 * Composes the marketing sections in order. Emits JSON-LD (Organization +
 * WebSite) so Google can surface the brand and the eventual sitelinks
 * searchbox. All page-level metadata inherits from the root layout; this
 * page only overrides the canonical URL to prevent trailing-slash duplicates.
 */

import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IndianSection } from "@/components/marketing/IndianSection";
import { ClosingCTA } from "@/components/marketing/ClosingCTA";

export const metadata: Metadata = {
  // Title + description inherited from the root layout template.
  alternates: { canonical: "/" },
};

function jsonLd() {
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
      inLanguage: "en-IN",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/calculators?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    // ItemList of the six calculators — surfaces them as sitelinks from the homepage.
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Construction calculators",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cement Calculator", url: `${siteUrl}/calculators/cement` },
        { "@type": "ListItem", position: 2, name: "Concrete Calculator", url: `${siteUrl}/calculators/concrete` },
        { "@type": "ListItem", position: 3, name: "Brick Calculator", url: `${siteUrl}/calculators/brick` },
        { "@type": "ListItem", position: 4, name: "Steel Calculator", url: `${siteUrl}/calculators/steel` },
        { "@type": "ListItem", position: 5, name: "Paint Calculator", url: `${siteUrl}/calculators/paint` },
        { "@type": "ListItem", position: 6, name: "Tile Calculator", url: `${siteUrl}/calculators/tile` },
      ],
    },
  ];
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <IndianSection />
        <ClosingCTA />
      </main>
      <SiteFooter />
    </>
  );
}
