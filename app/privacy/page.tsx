// Privacy Policy page
import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/app/lib/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";

const PAGE_PATH = "/privacy";
const TITLE = "Privacy Policy — How We Handle Your Data";
const DESCRIPTION =
  "iHateConstruction privacy policy. Learn what personal data we collect, how we use it, where it's stored, and your rights over your account, projects, calculations, and business data.";

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
        { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${siteUrl}${PAGE_PATH}` },
      ],
    },
  };
}

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">Last updated: 5 August 2026</p>

          <div className="prose prose-sm mt-8 max-w-none dark:prose-invert">
            <h2>1. Information We Collect</h2>
            <p>When you use iHateConstruction, we collect:</p>
            <ul>
              <li><strong>Account information:</strong> Name, email address, and authentication credentials (managed via Clerk).</li>
              <li><strong>Project data:</strong> Projects, calculations, materials, BOQs, quotations, and invoices you create.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, browser type, device info, and IP address.</li>
              <li><strong>Payment information:</strong> UPI IDs and QR codes you voluntarily upload. We do not process or store credit card numbers.</li>
            </ul>

            <h2>2. How We Use Your Data</h2>
            <ul>
              <li>Provide, maintain, and improve the service.</li>
              <li>Generate documents (BOQs, quotations, invoices, PDFs) as you request.</li>
              <li>Send transactional emails (account verification, password resets).</li>
              <li>Analyze usage patterns to improve features (aggregated, never sold).</li>
            </ul>

            <h2>3. Data Storage & Security</h2>
            <p>Your data is stored in encrypted databases hosted on secure cloud infrastructure. We use TLS for all data in transit. Authentication is handled by Clerk, a SOC 2 Type II compliant provider.</p>

            <h2>4. Data Sharing</h2>
            <p>We do not sell your data. We share data only with:</p>
            <ul>
              <li><strong>Service providers:</strong> Hosting (Vercel), authentication (Clerk), database (managed PostgreSQL) — only what's necessary for operations.</li>
              <li><strong>Your clients:</strong> When you generate a public quotation link, the quotation details are visible to anyone with the link.</li>
              <li><strong>Legal requirements:</strong> If required by Indian law or valid court order.</li>
            </ul>

            <h2>5. Your Rights</h2>
            <ul>
              <li><strong>Access:</strong> View all data associated with your account.</li>
              <li><strong>Export:</strong> Download your projects, calculations, and documents.</li>
              <li><strong>Deletion:</strong> Request complete deletion of your account and all associated data.</li>
              <li><strong>Correction:</strong> Update inaccurate information at any time.</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No advertising cookies. No third-party tracking pixels.</p>

            <h2>7. Data Retention</h2>
            <p>Your data is retained as long as your account is active. Deleted accounts are purged within 30 days. Audit logs are retained for 1 year for security purposes.</p>

            <h2>8. Children</h2>
            <p>iHateConstruction is not intended for users under 18. We do not knowingly collect data from minors.</p>

            <h2>9. Changes</h2>
            <p>We may update this policy. Material changes will be notified via email or in-app notice at least 14 days before taking effect.</p>

            <h2>10. Contact</h2>
            <p>For privacy-related queries: <a href="mailto:huzaif89@hotmail.com">huzaif89@hotmail.com</a></p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
