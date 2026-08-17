// About page
import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";

const PAGE_PATH = "/about";
const TITLE = "About — Free Construction Calculators & Contractor Software";
const DESCRIPTION =
  "About iHateConstruction — free construction calculators for cement, concrete, brick, steel, paint, and tile, plus BOQ, quotation, and GST invoicing built for Indian contractors.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "about ihateconstruction",
    "construction management software India",
    "contractor software India",
    "construction calculator app",
  ],
  openGraph: { type: "website", url: `${siteUrl}${PAGE_PATH}`, title: `${TITLE} — ${siteConfig.shortName}`, description: DESCRIPTION, siteName: siteConfig.shortName, images: [siteConfig.ogImage] },
  twitter: { card: "summary_large_image", title: `${TITLE} — ${siteConfig.shortName}`, description: DESCRIPTION, images: [siteConfig.ogImage] },
};

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: TITLE,
    url: `${siteUrl}${PAGE_PATH}`,
    description: DESCRIPTION,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "About", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  };
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About iHateConstruction</h1>

          <div className="prose prose-sm mt-8 max-w-none dark:prose-invert">
            <h2>The Problem</h2>
            <p>
              Construction in India is a ₹13 lakh crore industry — and most contractors still estimate costs on paper,
              send quotations via WhatsApp screenshots, and track payments in a notebook. The tools that exist are either
              built for American general contractors (Procore, Buildertrend) or too complex for a 5-person team doing
              residential work.
            </p>
            <p>
              We've watched contractors struggle with:
            </p>
            <ul>
              <li>Guessing material quantities → over-ordering by 15-20% (₹ straight into the drain)</li>
              <li>Quoting from memory → missing items, underpricing, awkward conversations later</li>
              <li>Tracking payments on paper → "Did they pay the second installment or not?"</li>
              <li>Sharing documents → WhatsApp forwards of blurry PDFs made in MS Paint</li>
            </ul>

            <h2>The Solution</h2>
            <p>
              iHateConstruction gives Indian contractors a single place to estimate, quote, invoice, and get paid —
              without the enterprise bloat or the $300/month price tag.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 not-prose my-6">
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">Calculators</p>
                <p className="mt-2 text-sm">Concrete, steel, brick, paint, tile — with Indian standards (IS codes) baked in.</p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">BOQ & Quotations</p>
                <p className="mt-2 text-sm">Generate professional Bills of Quantities and client-facing quotations in seconds.</p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">Invoices & Payments</p>
                <p className="mt-2 text-sm">Track who owes what. Share UPI QR for instant collection. Record payments with screenshot OCR.</p>
              </div>
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">PDF Export</p>
                <p className="mt-2 text-sm">Professional A4 documents your clients actually respect — not WhatsApp forwards.</p>
              </div>
            </div>

            <h2>Who It's For</h2>
            <ul>
              <li><strong>Independent contractors</strong> doing residential and small commercial projects.</li>
              <li><strong>Small construction firms</strong> (2-15 people) who need structure without overhead.</li>
              <li><strong>Civil engineers</strong> who estimate on the side and want accurate, repeatable calculations.</li>
              <li><strong>Interior designers</strong> who need material estimation for fit-out projects.</li>
            </ul>

            <h2>India First</h2>
            <p>
              Every decision we make starts with the Indian contractor:
            </p>
            <ul>
              <li>Calculations use IS codes and Indian standard practices (not ASTM or Eurocode).</li>
              <li>Material units match what you buy at the local godown — bags, CFT, running feet.</li>
              <li>Currency is INR. GST rates are built in. Tax region matters.</li>
              <li>Payment via UPI QR — because that's how India pays in 2026.</li>
              <li>Works on a ₹10,000 phone over 4G. No desktop-only workflows.</li>
            </ul>

            <h2>Contact</h2>
            <p>
              Have feedback, found a bug, or want to partner? Reach us at{" "}
              <a href="mailto:huzaif89@hotmail.com">huzaif89@hotmail.com</a> or use the{" "}
              <a href="/contact">contact form</a>.
            </p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
