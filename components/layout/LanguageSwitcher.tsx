"use client";

// Native <select> so it works on mobile without extra deps. Swaps the leading
// locale segment of the pathname and pushes; App Router treats it as a normal nav.

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, localeNames, isLocale, type Locale } from "@/app/i18n-config";

type Props = { current: Locale };

export function LanguageSwitcher({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!isLocale(next) || next === current) return;
    // Replace only the first path segment if it matches a known locale.
    const parts = pathname.split("/");
    if (parts.length > 1 && isLocale(parts[1] ?? "")) {
      parts[1] = next;
    } else {
      parts.splice(1, 0, next);
    }
    const target = parts.join("/") || `/${next}`;
    startTransition(() => router.push(target));
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Language</span>
      <select
        value={current}
        onChange={onChange}
        disabled={pending}
        aria-label="Language"
        className="appearance-none rounded border border-black/10 bg-transparent py-1 pl-2 pr-6 text-xs text-black/75 transition-colors hover:bg-black/[.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:text-white/75 dark:hover:bg-white/[.06] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-1.5 h-3 w-3 opacity-60"
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </label>
  );
}
