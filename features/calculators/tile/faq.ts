// FAQ content — rendered on page and emitted as JSON-LD FAQPage schema.

import type { FaqItem } from "@/features/calculators/brick";
export type { FaqItem };

export const TILE_FAQ: FaqItem[] = [
  {
    question: "Why is the default tile wastage 10% — higher than concrete or brick?",
    answer:
      "Tiles waste more because cuts at walls and corners produce half-tiles that usually can't be reused. Complex layouts (diagonals, borders, small rooms) waste even more; simple square rooms with tiles that fit the module cleanly can go down to 5–7%. Adjust in Customise once you know the room.",
  },
  {
    question: "Thin-set adhesive vs. mortar bed — which one should I quote?",
    answer:
      "Thin-set (tile adhesive) is the modern default — 3–5mm of cement-based adhesive, works with vitrified and ceramic tiles, sold by the bag. Mortar bed is the traditional Indian method: 20mm of cement:sand mortar laid first, then tiles pressed in. Older buildings and structural tile work still use it; new construction is almost entirely thin-set.",
  },
  {
    question: "Does the grout estimate include waste for spillage and mixing loss?",
    answer:
      "No — the volume is the raw geometric fill of the joints. Real grout consumption is 15–25% higher after mixing waste, joint depth variance, and spillage. Buy at least one full bag more than the estimate suggests, especially for larger jobs.",
  },
  {
    question: "Do I need to include the tile thickness in the joint depth?",
    answer:
      "Usually the grout doesn't go all the way to the substrate — it fills the top ~60–80% of the joint. We default `groutDepth` to the tile thickness for a conservative estimate; drop it to 6mm if you're only grouting the surface layer. Either way the volume is small and easy to over-order without much cost impact.",
  },
  {
    question: "How do I calculate skirting tiles or borders?",
    answer:
      "Skirtings and borders are separate line items — they're strip pieces, cut differently, and often a different tile. Compute them separately: length of the border × height × 1.10 wastage gives the area, divide by the border-tile area to get count. The Project module (coming later) will let you sum these into a single quote.",
  },
];
