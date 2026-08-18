// Bottom-of-page CTA. Copy comes from dict.

import { Container } from "@/components/layout/Container";
import { Icon } from "@/components/ui/Icon";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type Props = { dict: Dictionary["home"]["closing"]; locale: string };

export function ClosingCTA({ dict, locale }: Props) {
  return (
    <section className="py-20">
      <Container>
        <div className="rounded-xl border border-black/10 bg-white p-10 text-center md:p-16 dark:border-white/10 dark:bg-black">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-black/70 dark:text-white/70">
            {dict.body}
          </p>
          <div className="mt-8">
            <a
              href={`/${locale}/calculators/brick-calculator`}
              className="inline-flex h-11 items-center gap-2 rounded bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:hover:bg-white/85 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
            >
              {dict.cta}
              <Icon name="arrow-right" size={16} decorative />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
