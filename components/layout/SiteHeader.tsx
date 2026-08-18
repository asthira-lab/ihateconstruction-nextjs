// Global top nav — sticky, hairline-divided, locale-aware.
// Desktop shows inline links; below sm a hamburger opens a floating overlay.

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Container } from "./Container";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
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

  // Shared link styles for the mobile drawer rows.
  const mobileLink =
    "block rounded px-3 py-2 text-sm text-black/80 hover:bg-black/[.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:text-white/80 dark:hover:bg-white/[.06] dark:focus-visible:ring-white";

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-white/10 dark:bg-black/85 dark:supports-[backdrop-filter]:bg-black/70">
      <Container as="nav" className="relative flex h-14 items-center justify-between">
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

        {/* Desktop nav — hidden below sm. */}
        <div className="hidden items-center gap-1 sm:flex">
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

        {/* Mobile hamburger — hidden at sm+. Panel is absolutely positioned so it overlays content. */}
        <MobileMenu openLabel={t.calculators} closeLabel={t.calculators}>
          <Link href={`/${locale}/calculators`} className={mobileLink}>
            {t.calculators}
          </Link>
          {signedIn ? (
            <>
              <Link href={`/${locale}/projects`} className={mobileLink}>
                {t.projects}
              </Link>
              <div className="px-3 py-2">
                <UserButton />
              </div>
            </>
          ) : (
            <SignInButton mode="modal">
              <button type="button" className={`${mobileLink} w-full text-left`}>
                {t.signIn}
              </button>
            </SignInButton>
          )}
          <div className="px-3 py-2">
            <LanguageSwitcher current={locale} />
          </div>
        </MobileMenu>
      </Container>
    </header>
  );
}
