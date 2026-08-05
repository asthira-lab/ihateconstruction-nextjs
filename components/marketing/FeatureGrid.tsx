/**
 * FeatureGrid — 3 cards describing what the platform is (and what's coming).
 *
 * Renders in a single column on mobile, three columns from md up.
 * Uses the shared `Card` primitive so borders and dark-mode behavior match
 * the rest of the site.
 */

import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Feature {
  icon: IconName;
  title: string;
  description: string;
  status?: "coming";
}

const FEATURES: Feature[] = [
  {
    icon: "calculator",
    title: "Calculators",
    description:
      "Five field-tested calculators for concrete, brick, paint, tile, and steel. Enter your job, get exact material quantities.",
  },
  {
    icon: "layers",
    title: "Projects & BOQ",
    description:
      "Save every calculation to a project. Auto-build a bill of quantities with running totals.",
    status: "coming",
  },
  {
    icon: "receipt",
    title: "Quotations & invoices",
    description:
      "Professional PDFs with your logo, client details, GST breakdown, and Indian bank details.",
    status: "coming",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            What&apos;s inside
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One platform. From estimate to invoice.
          </h2>
          <p className="mt-4 text-base text-black/70 dark:text-white/70">
            Start with the calculators today. Save results to projects, generate
            BOQ and quotations, and send GST-ready invoices — all under one roof.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <div className="flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black dark:border-white/15 dark:text-white"
                >
                  <Icon name={f.icon} size={20} decorative />
                </span>
                {f.status === "coming" ? (
                  <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-black/60 dark:border-white/15 dark:text-white/60">
                    Coming soon
                  </span>
                ) : null}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {f.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
