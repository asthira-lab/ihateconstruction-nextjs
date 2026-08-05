/**
 * IndianSection — trust / market fit.
 *
 * Two-column on desktop: pitch copy left, bullet list right. Signals to a
 * contractor at a glance that this tool speaks their language (units,
 * standards, GST) instead of being a US import.
 */

import { Container } from "@/components/layout/Container";
import { Icon } from "@/components/ui/Icon";

const BULLETS = [
  "Modular, traditional, and AAC block presets",
  "Cement in 50 kg bags, sand in cubic feet",
  "Metric or imperial input, per field",
  "Wastage percentages contractors actually use",
  "GST-ready outputs (coming with quotations)",
  "IS 1077 modular brick as a first-class default",
];

export function IndianSection() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
              Built for Indian sites
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              In Indian units, for how Indian contractors buy.
            </h2>
            <p className="mt-5 text-base text-black/70 dark:text-white/70">
              Every calculator ships with the presets you use on site — IS 1077
              modular brick, traditional 230×110×75 mm brick, AAC blocks.
              Quantities come out in the units you&apos;ll order in, so what the
              calculator says is what you tell the supplier.
            </p>
            <p className="mt-4 text-base text-black/70 dark:text-white/70">
              No conversion tables. No &ldquo;close enough&rdquo;. No US-import
              terminology that doesn&apos;t match how the job actually runs.
            </p>
          </div>

          <ul className="space-y-3">
            {BULLETS.map((b) => (
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
