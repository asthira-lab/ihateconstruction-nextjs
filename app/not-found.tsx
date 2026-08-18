// Root not-found — returns proper 404 status. Locale-agnostic (matches /[bad] before locale routes resolve).
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "./lib/site";

export const metadata: Metadata = {
  title: `Page not found — ${siteConfig.shortName}`,
  description: "The page you're looking for doesn't exist. Head back to the free construction calculators.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-black dark:text-white">
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="max-w-lg text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">404</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Page not found</h1>
            <p className="mt-4 text-base text-black/70 dark:text-white/70">
              We couldn&apos;t find that page. It may have moved, or the link is misspelled.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/en"
                className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                Go home
              </Link>
              <Link
                href="/en/calculators"
                className="rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                Browse calculators
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
