// Global footer. Dict-driven; footer links are locale-prefixed.

import { Container } from "./Container";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { lang as rootLang } from "next/root-params";
import { isLocale, defaultLocale } from "@/app/i18n-config";

interface FooterLink {
  label: string;
  href?: string;
}

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

export async function SiteFooter() {
  const dict = await getDictionary();
  const t = dict.footer;
  const raw = await rootLang();
  const locale = raw && isLocale(raw) ? raw : defaultLocale;
  const year = 2026; // Deterministic — no `new Date()` on server for cache-friendliness.

  const PRODUCT: FooterLink[] = [
    { label: t.calculators, href: `/${locale}/calculators` },
    { label: t.roadmap },
    { label: t.projectsBoq, href: `/${locale}/projects` },
    { label: t.quotations, href: `/${locale}/projects` },
  ];
  const COMPANY: FooterLink[] = [
    { label: t.about, href: `/${locale}/about` },
    { label: t.contact, href: `/${locale}/contact` },
  ];
  const LEGAL: FooterLink[] = [
    { label: t.privacy, href: `/${locale}/privacy` },
    { label: t.terms, href: `/${locale}/terms` },
  ];

  return (
    <footer className="mt-24 border-t border-black/10 py-12 dark:border-white/10">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-mono text-[13px] uppercase tracking-[.14em]">
              ihateconstruction
            </p>
            <p className="mt-3 text-sm text-black/60 dark:text-white/60">
              {t.tagline}
            </p>
          </div>

          <FooterList title={t.product} links={PRODUCT} />
          <FooterList title={t.company} links={COMPANY} />
          <FooterList title={t.legal} links={LEGAL} />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-6 text-xs text-black/50 dark:border-white/5 dark:text-white/50">
          <p>{t.copy.replace("{year}", String(year))}</p>
          <p>{t.made}</p>
        </div>
      </Container>
    </footer>
  );
}
