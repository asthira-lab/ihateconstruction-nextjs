/**
 * Hero — the top-of-page headline block.
 *
 * No image. The typography IS the design. Generous vertical padding so the
 * H1 has room to breathe. Primary CTA points at /calculators.
 */

import { Container } from "@/components/layout/Container";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section className="border-b border-black/5 dark:border-white/5">
      <Container className="py-20 md:py-28">
        <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
          Free tools for Indian contractors
        </p>

        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-black sm:text-5xl md:text-6xl dark:text-white">
          Estimating and calculators built for how contractors actually work.
        </h1>

        <p className="mt-6 max-w-2xl text-base text-black/70 sm:text-lg dark:text-white/70">
          Free, unit-aware calculators that turn wall dimensions into material
          orders — bricks, cement, sand, tile, paint, steel. Projects, BOQ, and
          GST-ready quotations are coming next.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="/calculators"
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:hover:bg-white/85 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            Open calculators
            <Icon name="arrow-right" size={16} decorative />
          </a>
          <a
            href="/calculators/brick-calculator"
            className="inline-flex h-11 items-center justify-center rounded border border-black/15 px-5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/20 dark:text-white dark:hover:bg-white/[.06] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            Try the brick calculator
          </a>
        </div>

        <p className="mt-6 text-xs text-black/50 dark:text-white/50">
          No account required · Metric and imperial · Works on mobile
        </p>
      </Container>
    </section>
  );
}
