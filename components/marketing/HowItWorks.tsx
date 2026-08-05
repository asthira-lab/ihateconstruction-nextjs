/**
 * HowItWorks — three numbered steps. Horizontal on desktop, stacked on mobile.
 *
 * Numbers rendered as tall mono digits — the ONE decorative element on the
 * homepage that isn't a border. Keeps monochrome discipline while giving
 * the section rhythm.
 */

import { Container } from "@/components/layout/Container";

const STEPS = [
  {
    n: "01",
    title: "Pick a calculator",
    body: "Choose from concrete, brick, paint, tile, or steel. Each one ships with the presets you actually use on site.",
  },
  {
    n: "02",
    title: "Enter your job",
    body: "Wall dimensions, mix ratios, wastage — sliders for the shape you want, direct entry for the exact number.",
  },
  {
    n: "03",
    title: "Get your order list",
    body: "Bricks in pieces, cement in 50 kg bags, sand in cubic feet. Ready to hand to your supplier.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-black/5 bg-black/[.015] py-20 dark:border-white/5 dark:bg-white/[.02]">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps, no spreadsheet.
          </h2>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <p className="font-mono text-4xl font-semibold tabular-nums text-black/25 dark:text-white/20">
                {s.n}
              </p>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
