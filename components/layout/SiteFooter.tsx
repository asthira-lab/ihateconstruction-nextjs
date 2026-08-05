/**
 * SiteFooter — 3-column footer, shared across all pages.
 *
 * Deliberately renders dead links as muted <span>s instead of <a>s: a link
 * that 404s destroys trust more than a missing link. When each route lands,
 * flip its <span> to <a href="…"> — no other changes needed.
 */

import { Container } from "./Container";

interface FooterLink {
  label: string;
  href?: string; // absent = not built yet, renders as span
}

const PRODUCT: FooterLink[] = [
  { label: "Calculators", href: "/calculators" },
  { label: "Roadmap" },
  { label: "Projects & BOQ", href: "/projects" },
  { label: "Quotations", href: "/projects" },
];

const COMPANY: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const LEGAL: FooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

function FooterList({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) =>
          l.href ? (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-black/75 transition-colors hover:text-black focus:outline-none focus-visible:underline dark:text-white/75 dark:hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label} className="text-black/40 dark:text-white/40">
              {l.label}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = 2026; // Deterministic — no `new Date()` on server for cache-friendliness.
  return (
    <footer className="mt-24 border-t border-black/10 py-12 dark:border-white/10">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Wordmark + tagline occupies the first column */}
          <div className="md:col-span-1">
            <p className="font-mono text-[13px] uppercase tracking-[.14em]">
              ihateconstruction
            </p>
            <p className="mt-3 text-sm text-black/60 dark:text-white/60">
              Construction calculators and estimating tools for contractors.
            </p>
          </div>

          <FooterList title="Product" links={PRODUCT} />
          <FooterList title="Company" links={COMPANY} />
          <FooterList title="Legal" links={LEGAL} />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-6 text-xs text-black/50 dark:border-white/5 dark:text-white/50">
          <p>© {year} ihateconstruction.co</p>
          <p>Made for Indian construction sites · en-IN</p>
        </div>
      </Container>
    </footer>
  );
}
