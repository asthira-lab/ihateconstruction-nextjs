// Top-of-page hero. Copy comes from the server-loaded dictionary.

import { Container } from "@/components/layout/Container";
import { Icon } from "@/components/ui/Icon";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type Props = { dict: Dictionary["home"]["hero"]; locale: string };

export function Hero({ dict, locale }: Props) {
  return (
    <section className="border-b border-black/5 dark:border-white/5">
      <Container className="py-20 md:py-28">
        <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
          {dict.eyebrow}
        </p>

        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-black sm:text-5xl md:text-6xl dark:text-white">
          {dict.title}
        </h1>

        <p className="mt-6 max-w-2xl text-base text-black/70 sm:text-lg dark:text-white/70">
          {dict.subtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={`/${locale}/calculators`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:hover:bg-white/85 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            {dict.ctaPrimary}
            <Icon name="arrow-right" size={16} decorative />
          </a>
          <a
            href={`/${locale}/calculators/concrete-calculator`}
            className="inline-flex h-11 items-center justify-center rounded border border-black/15 px-5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/20 dark:text-white dark:hover:bg-white/[.06] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            {dict.ctaSecondary}
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/70 dark:text-white/70">
          {dict.trust.map((bullet) => (
            <li key={bullet} className="inline-flex items-center gap-2">
              <Icon name="check" size={16} decorative className="text-black/50 dark:text-white/50" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-black/50 dark:text-white/50">
          {dict.note}
        </p>
      </Container>
    </section>
  );
}
