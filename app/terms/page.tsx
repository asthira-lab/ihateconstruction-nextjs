// Terms of Service page
import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";

const PAGE_PATH = "/terms";
const TITLE = "Terms of Service — Rules for Using iHateConstruction";
const DESCRIPTION =
  "iHateConstruction terms of service. The rules for using our free construction calculators, project management, BOQ builder, quotation and invoice tools, and payment collection features.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  robots: { index: true, follow: true },
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

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: `${siteUrl}${PAGE_PATH}`,
    description: DESCRIPTION,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Terms of Service", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  };
}

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">Last updated: 5 August 2026</p>

          <div className="prose prose-sm mt-8 max-w-none dark:prose-invert">
            <h2>1. Acceptance</h2>
            <p>By accessing or using iHateConstruction ("the Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

            <h2>2. Description of Service</h2>
            <p>iHateConstruction is a construction management and estimating platform that provides:</p>
            <ul>
              <li>Construction material calculators (concrete, steel, brick, paint, tile).</li>
              <li>Project management with saved calculations and material pricing.</li>
              <li>Bill of Quantities (BOQ) generation.</li>
              <li>Quotation and invoice creation with PDF export.</li>
              <li>Payment collection tools (UPI QR, payment links).</li>
            </ul>

            <h2>3. User Accounts</h2>
            <ul>
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for all activity under your account.</li>
              <li>You must not share your credentials or let others access your account.</li>
              <li>We may suspend or terminate accounts that violate these Terms.</li>
            </ul>

            <h2>4. Your Data</h2>
            <ul>
              <li>You retain ownership of all content you create (projects, calculations, documents).</li>
              <li>You grant us a limited license to store, process, and display your data solely to provide the Service.</li>
              <li>We do not claim ownership of your business data.</li>
            </ul>

            <h2>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for illegal purposes.</li>
              <li>Upload malicious content or attempt to breach security.</li>
              <li>Scrape, crawl, or bulk-download data from the Service.</li>
              <li>Impersonate another person or entity.</li>
              <li>Use the calculators for safety-critical engineering decisions without independent professional verification.</li>
            </ul>

            <h2>6. Calculator Disclaimer</h2>
            <p><strong>Important:</strong> The calculators provide estimates based on standard formulas and regional standards. They are tools for estimation, not substitutes for professional structural engineering. Always verify quantities with a qualified engineer before procurement or construction.</p>

            <h2>7. Payment Features</h2>
            <ul>
              <li>Payment collection features (UPI QR, payment links) facilitate communication between you and your clients.</li>
              <li>We are not a payment processor. Money flows directly between you and your client.</li>
              <li>We are not liable for payment disputes, failed transactions, or incorrect amounts.</li>
              <li>Where we integrate payment gateways (Razorpay), their terms also apply.</li>
            </ul>

            <h2>8. Availability</h2>
            <p>We aim for high availability but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance. We are not liable for losses due to downtime.</p>

            <h2>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by Indian law:</p>
            <ul>
              <li>The Service is provided "as is" without warranties of any kind.</li>
              <li>We are not liable for indirect, incidental, or consequential damages.</li>
              <li>Our total liability is limited to the amount you paid us in the 12 months preceding the claim (or ₹5,000, whichever is higher).</li>
            </ul>

            <h2>10. Intellectual Property</h2>
            <ul>
              <li>The Service, its design, code, and branding are our intellectual property.</li>
              <li>You may not copy, modify, or redistribute any part of the Service.</li>
              <li>The name "iHateConstruction" and associated marks are our trademarks.</li>
            </ul>

            <h2>11. Termination</h2>
            <ul>
              <li>You may delete your account at any time.</li>
              <li>We may terminate your access for Terms violations with notice.</li>
              <li>On termination, you have 30 days to export your data before it is deleted.</li>
            </ul>

            <h2>12. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>

            <h2>13. Changes</h2>
            <p>We may modify these Terms. Material changes will be communicated 14 days in advance. Continued use after changes constitutes acceptance.</p>

            <h2>14. Contact</h2>
            <p>Questions about these Terms: <a href="mailto:legal@ihateconstruction.co">legal@ihateconstruction.co</a></p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
