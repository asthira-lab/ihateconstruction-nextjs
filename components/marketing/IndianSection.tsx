// Trust / market fit. Two-column layout, bullets rendered from dict.

import { Container } from "@/components/layout/Container";
import { Icon } from "@/components/ui/Icon";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type Props = { dict: Dictionary["home"]["indian"] };

export function IndianSection({ dict }: Props) {
  return (
    <section className="py-20">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
              {dict.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {dict.title}
            </h2>
            <p className="mt-5 text-base text-black/70 dark:text-white/70">
              {dict.body1}
            </p>
            <p className="mt-4 text-base text-black/70 dark:text-white/70">
              {dict.body2}
            </p>
          </div>

          <ul className="space-y-3">
            {dict.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-black/15 text-black dark:border-white/20 dark:text-white"
                >
                  <Icon name="check" size={12} decorative />
                </span>
                <span className="text-black/80 dark:text-white/80">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
