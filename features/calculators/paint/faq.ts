/**
 * FAQ content for the paint calculator page.
 *
 * Rendered visibly on the page AND emitted as JSON-LD FAQPage schema so
 * Google can surface these as rich results.
 */

import type { FaqItem } from "@/features/calculators/brick";
export type { FaqItem };

export const PAINT_FAQ: FaqItem[] = [
  {
    question:
      "Why does my hardware store's coverage number differ from yours?",
    answer:
      "Coverage varies a lot — brand, dilution, surface texture, and whether it's a first or re-coat all matter. Our presets are middle-of-the-road averages for the Indian market. If the paint can you're using lists its own coverage, plug that in via the Customise panel and the estimate will match exactly.",
  },
  {
    question: "Do I need primer under emulsion?",
    answer:
      "For a fresh wall or one that's been putty'd, yes — primer seals the surface and stops the finish coat from soaking in unevenly. For a repaint over an existing emulsion, one coat of primer is optional if the old coat is clean and sound.",
  },
  {
    question: "How many finish coats should I quote for?",
    answer:
      "Two is the industry default — one coat rarely gives even colour, especially over primer or a light-over-dark repaint. Bump to three for deep colours (dark red, navy) or high-traffic areas where you want long life.",
  },
  {
    question: "Why is wall putty priced by area if it's sold by weight?",
    answer:
      "Putty is quoted at roughly 20–25 sqm per kg, so we express its coverage in the same sqm/litre style as paint to keep the calculator uniform. Treat the litre value as \"units of putty\" and convert to kg at purchase time using your brand's own guidance.",
  },
  {
    question: "Should I paint the ceiling in the same layer as the walls?",
    answer:
      "If you're using the same finish product on both, yes — tick \"include ceiling\" and it's added to the net area. If ceiling paint is a different product (e.g. white distemper on a coloured wall), run two separate calculations.",
  },
];
