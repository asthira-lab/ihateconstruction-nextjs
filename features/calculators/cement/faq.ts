// FAQ content for the cement calculator page. Rendered on-page + emitted as
// FAQPage JSON-LD schema so Google can surface these as rich results.

export interface FaqItem {
  question: string;
  answer: string;
}

export const CEMENT_FAQ: FaqItem[] = [
  {
    question: "How does this cement calculator work?",
    answer:
      "Pick a shape (concrete slab, post hole, or a free volume in cubic yards or cubic metres), choose a mix ratio, and select the cement bag size you buy locally — 50 kg (India), 94 lb Portland (US), or one of the smaller retail bags. The calculator converts your job into dry volume using the standard 1.54 shrinkage factor, splits it into cement / sand / aggregate by the mix ratio, applies your wastage percentage, then rounds cement up to whole bags.",
  },
  {
    question: "How many bags of cement do I need for a concrete slab?",
    answer:
      "For a typical M20 (1:1.5:3) slab, one cubic yard of concrete needs about 5 bags of 94 lb Portland cement, or roughly 8 bags of 50 kg cement. For a 10 ft × 10 ft × 4 in slab (≈ 1.23 cuyd) that's about 6 bags of 94 lb or 10 bags of 50 kg. This calculator gives you the exact number for your dimensions.",
  },
  {
    question: "How much cement do I need for a post hole?",
    answer:
      "A standard 4-inch fence post in a 10-inch-wide, 24-inch-deep hole takes about 1.1 cubic feet of concrete — roughly half a 60 lb bag of pre-mix, or about 6 kg of cement plus sand for a site-mixed 1:3 fill. Enter your hole diameter, depth, and post count and the calculator returns the total cement bags for the full set.",
  },
  {
    question: "How much Portland cement is in a 94 lb bag?",
    answer:
      "A 94 lb bag is the US standard for pure Portland cement and holds exactly one cubic foot of loose cement — about 42.6 kg. It's not the same as a 94 lb concrete-mix bag; concrete mix already contains sand and aggregate. If you're buying pure cement to combine with sand and aggregate on site, pick the 94 lb Portland option.",
  },
  {
    question: "How do I calculate cement in cubic yards?",
    answer:
      "Multiply length × width × thickness (all in feet — convert inches by dividing by 12) to get cubic feet, then divide by 27 to get cubic yards. This calculator does the conversion for you: enter feet and inches directly and it returns cement bags for that volume in whichever bag size you select.",
  },
  {
    question: "What mix ratio should I use — 1:2:4 or 1:1.5:3?",
    answer:
      "1:2:4 (M15) is fine for footpaths, patio slabs, and non-structural pours where the concrete only carries its own weight. 1:1.5:3 (M20) is the standard for house slabs, driveways, and general RCC work. 1:1:2 (M25) is used when the slab is a structural member carrying real load. For sand-and-cement work — plastering or brickwork — use 1:4 or 1:6 instead.",
  },
  {
    question: "Does this calculator work for sand and cement only (no aggregate)?",
    answer:
      "Yes. Pick the Brickwork mortar (1:6), Plaster mortar (1:4), or Post hole (1:3) preset — these are sand-and-cement mixes with zero aggregate. The output shows cement bags and sand quantity in both weight (kg) and volume (cubic feet).",
  },
  {
    question: "Why is the dry volume higher than the wet volume?",
    answer:
      "When dry cement, sand, and aggregate mix into wet concrete, the fine particles fill voids in the coarser ones and the total volume shrinks. The industry-standard multiplier is 1.54 — meaning one cubic metre of finished concrete needs about 1.54 cubic metres of loose dry ingredients before mixing.",
  },
];
