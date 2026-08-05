// FAQ for the steel calculator page — also emitted as JSON-LD FAQPage schema.

import type { FaqItem } from "@/features/calculators/brick";
export type { FaqItem };

export const STEEL_FAQ: FaqItem[] = [
  {
    question: "What's D²/162 and where does it come from?",
    answer:
      "It's the industry shortcut for the weight per metre of a round steel bar of diameter D millimetres. It comes from π × (D/2)² × 7850 kg/cum ÷ 10⁶ ≈ D²/162.28. Contractors round to 162 in the field. Use 162.28 if you want a slightly tighter number.",
  },
  {
    question:
      "Bar schedule vs thumb rule — which should I use?",
    answer:
      "Bar schedule when you have the drawing and can list every bar's diameter, length, and count — the answer is accurate. Thumb rule when you're at the pricing stage and only know the concrete volume — it's rough (±20%), useful for a ballpark, not for a purchase order.",
  },
  {
    question: "Do the numbers include laps, bends, hooks, and chairs?",
    answer:
      "No — Phase 1 doesn't model laps, bends, hooks, or chair bars. In bar-schedule mode, pass pre-calculated cutting lengths; in thumb-rule mode the built-in kg/cum values already absorb a rough allowance for laps. Either way, bump the wastage % if you want a bigger safety margin.",
  },
  {
    question:
      "Why do slab, beam, column, footing, and staircase all have different kg per cum?",
    answer:
      "Denser members carry more reinforcement per unit volume. Columns and staircases are ~130 kg/cum, beams ~100, slabs ~80, footings ~70. These are Indian industry averages; override them if your consultant has a project-specific number.",
  },
];
