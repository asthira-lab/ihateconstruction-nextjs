// Global top nav — sticky, hairline-divided, locale-aware.

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Container } from "./Container";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { lang as rootLang } from "next/root-params";
import { isLocale, defaultLocale } from "@/app/i18n-config";

export async function SiteHeader() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);
  const dict = await getDictionary();
  const t = dict.header;
  const raw = await rootLang();
  const locale = raw && isLocale(raw) ? raw : defaultLocale;
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-white/10 dark:bg-black/85 dark:supports-[backdrop-filter]:bg-black/70">
      <Container as="nav" className="flex h-14 items-center justify-between">
        <Link
          href={`/${locale}`}
          className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          aria-label={t.homeAria}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white"
          >
            <Icon name="hammer" size={14} decorative />
          </span>
          <span className="font-mono text-[13px] uppercase tracking-[.14em]">
            {t.brand}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/calculators`}
            className="rounded px-3 py-1.5 text-sm text-black/75 transition-colors hover:bg-black/[.05] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white/75 dark:hover:bg-white/[.06] dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            {t.calculators}
          </Link>
          {signedIn ? (
            <>
              <Link
                href={`/${locale}/projects`}
                className="rounded px-3 py-1.5 text-sm text-black/75 transition-colors hover:bg-black/[.05] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white/75 dark:hover:bg-white/[.06] dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
              >
                {t.projects}
              </Link>
              <div className="pl-1">
                <UserButton />
              </div>
            </>
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-sm text-black/75 transition-colors hover:bg-black/[.05] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white/75 dark:hover:bg-white/[.06] dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
              >
                {t.signIn}
              </button>
            </SignInButton>
          )}
          <div className="pl-1">
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </Container>
    </header>
  );
}
