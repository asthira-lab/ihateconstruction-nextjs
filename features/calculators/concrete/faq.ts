/**
 * FAQ content for the concrete calculator page.
 *
 * Rendered on-page AND emitted as JSON-LD FAQPage schema so Google can
 * surface these as rich results.
 */

import type { FaqItem } from "@/features/calculators/brick";
export type { FaqItem };

export const CONCRETE_FAQ: FaqItem[] = [
  {
    question: "How is the concrete quantity calculated?",
    answer:
      "The wet volume you enter is multiplied by a dry-to-wet factor of 1.54 to get the loose dry volume of material needed. That dry volume is split by the mix ratio into cement, sand, and coarse aggregate, then a 3% wastage margin is added on top. Cement is converted to 50 kg bags and rounded up.",
  },
  {
    question: "Which mix should I pick — M15, M20, or M25?",
    answer:
      "M20 (1:1.5:3) is the general-purpose choice for slabs, beams, and columns under light-to-moderate load. M25 (1:1:2) is the IS 456 minimum for RCC members in most structural situations. M15 and below are used for foundations, PCC, and non-structural work. Anything M30 or higher should be a design mix — not a fixed ratio like these presets — because higher grades need lab-proportioned material.",
  },
  {
    question: "Why is the dry-to-wet factor 1.54?",
    answer:
      "When dry cement, sand, and aggregate combine into wet concrete, the finer particles fill the voids in the coarser ones and the total volume shrinks. 1.54 is the industry-standard multiplier that accounts for that shrinkage — so 1 cubic meter of finished concrete needs about 1.54 cubic meters of loose dry ingredients.",
  },
  {
    question: "Why are my cement bags rounded up?",
    answer:
      "Contractors buy cement in whole 50 kg bags, not fractions. The calculator rounds the cement requirement up to the next full bag so you order what's actually available. The exact kg is shown alongside if you need it for cost estimation.",
  },
  {
    question: "Can I change the mix ratio or wastage?",
    answer:
      "Yes. Tick 'Customise this standard' under the preset chooser and every parameter — mix ratio, wastage percentage, cement density, bag weight, and the dry-to-wet factor — becomes editable. The preset defaults are IS 456 values for the common grades.",
  },
  {
    question: "Does this include steel reinforcement?",
    answer:
      "No. Steel is calculated separately because bar schedules depend on the member type (beam, column, slab, footing) and its detailing, not on the concrete volume alone. A dedicated steel calculator will cover that.",
  },
];
