/**
 * FAQ content for the brick calculator page.
 *
 * Rendered visibly on the page AND emitted as JSON-LD FAQPage schema so
 * Google can surface these as rich results.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const BRICK_FAQ: FaqItem[] = [
  {
    question: "How is the number of bricks calculated?",
    answer:
      "Total masonry volume is divided by the nominal volume of a single brick — the brick plus a mortar joint on all three axes. The result is rounded up to the next whole brick, and then a wastage percentage (5% by default for standard bricks) is applied on top.",
  },
  {
    question: "What is the difference between the presets?",
    answer:
      "Modular brick (190×90×90 mm) follows IS 1077 with a 10 mm joint — the standard used by most engineers. Traditional Indian brick (230×110×75 mm) is the common non-modular size seen widely on site. AAC block (600×200×200 mm) is a much larger, lighter unit with a thin 3 mm joint.",
  },
  {
    question: "How is the mortar volume calculated?",
    answer:
      "Mortar volume = total masonry volume − volume of bricks used. That gives you the wet mortar. Adding a 20% wastage factor (default) accounts for spillage and joints filling. Multiplying by a 1.33 dry-to-wet factor gives you the dry cement + sand you actually need to mix.",
  },
  {
    question: "Why do you split cement into bags and sand into cft?",
    answer:
      "That's how contractors and material suppliers in India quote and order — cement in 50 kg bags, sand in cubic feet. The math is done in SI internally; the answer is presented in the units you'll actually use to order.",
  },
  {
    question: "Can I use my own brick size and mortar ratio?",
    answer:
      "Yes. Switch the preset dropdown to 'Custom' and every parameter — brick dimensions, joint thickness, mortar ratio, wastage percentages — becomes editable.",
  },
  {
    question: "Are openings subtracted correctly?",
    answer:
      "Doors and windows are subtracted from the wall's gross area as rectangles. For arched or non-rectangular openings, approximate them with their bounding rectangle. If total openings exceed the wall area, the calculator returns an error instead of a nonsensical result.",
  },
];
