// Three numbered steps. Numbers are decorative; copy comes from dict.

import { Container } from "@/components/layout/Container";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type Props = { dict: Dictionary["home"]["howItWorks"] };

const NUMS = ["01", "02", "03"] as const;
type StepKey = "pick" | "enter" | "order";
const KEYS: StepKey[] = ["pick", "enter", "order"];

export function HowItWorks({ dict }: Props) {
  return (
    <section className="border-y border-black/5 bg-black/[.015] py-20 dark:border-white/5 dark:bg-white/[.02]">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            {dict.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.title}
          </h2>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          {KEYS.map((k, i) => {
            const step = dict.steps[k];
            return (
              <li key={k} className="relative">
                <p className="font-mono text-4xl font-semibold tabular-nums text-black/25 dark:text-white/20">
                  {NUMS[i]}
                </p>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
