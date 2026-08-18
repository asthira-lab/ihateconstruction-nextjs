// 3 marketing cards. Icons are hardcoded; copy comes from dict.

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type Props = {
  dict: Dictionary["home"]["features"];
  comingLabel: string;
  locale: string;
};

type CardKey = "calculators" | "projects" | "quotations";
const CARDS: { key: CardKey; icon: IconName; href?: string; coming?: true }[] = [
  { key: "calculators", icon: "calculator" },
  { key: "projects", icon: "layers", coming: true },
  { key: "quotations", icon: "receipt", coming: true },
];

export function FeatureGrid({ dict, comingLabel, locale }: Props) {
  return (
    <section className="py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            {dict.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.title}
          </h2>
          <p className="mt-4 text-base text-black/70 dark:text-white/70">
            {dict.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CARDS.map((c) => {
            const card = dict.cards[c.key];
            return (
              <Card key={c.key}>
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black dark:border-white/15 dark:text-white"
                  >
                    <Icon name={c.icon} size={20} decorative />
                  </span>
                  {c.coming ? (
                    <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-black/60 dark:border-white/15 dark:text-white/60">
                      {comingLabel}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {c.key === "calculators" ? (
                    <Link
                      href={`/${locale}/calculators`}
                      className="underline-offset-4 hover:underline"
                    >
                      {card.title}
                    </Link>
                  ) : (
                    card.title
                  )}
                </h3>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                  {card.body}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
