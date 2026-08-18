/**
 * Central registry of the calculators the site advertises.
 *
 * One source of truth so the homepage, calculator index, related-calculators
 * strip on individual calculator pages, and the sitemap all agree on what
 * exists and what's still coming. When a calculator ships, flip its `status`
 * from "coming" to "live" and nothing else needs to change.
 *
 * Safe to import from anywhere — pure data, no runtime deps.
 */

export type CalculatorStatus = "live" | "coming";

export interface CalculatorEntry {
  slug: string;
  title: string;
  description: string;
  status: CalculatorStatus;
}

export const CALCULATORS: CalculatorEntry[] = [
  {
    slug: "cement-calculator",
    title: "Cement calculator",
    description:
      "Bags of cement for a slab, post hole, or any volume. Supports 94 lb Portland, 50 kg, and sand-and-cement mixes.",
    status: "live",
  },
  {
    slug: "brick-calculator",
    title: "Brick calculator",
    description:
      "Bricks, mortar, cement, and sand for any wall, patio, paver, or fire pit. Supports modular, traditional, red brick, fire brick, and AAC.",
    status: "live",
  },
  {
    slug: "concrete-calculator",
    title: "Concrete calculator",
    description:
      "Cement, sand, and aggregate for a given volume and mix ratio (M15, M20, M25, custom).",
    status: "live",
  },
  {
    slug: "steel-calculator",
    title: "Steel calculator",
    description:
      "Reinforcement weight for beams, columns, and slabs from a bar schedule.",
    status: "live",
  },
  {
    slug: "paint-calculator",
    title: "Paint calculator",
    description:
      "Litres of paint for interior or exterior walls, factoring surface area, coats, and coverage.",
    status: "live",
  },
  {
    slug: "tile-calculator",
    title: "Tile calculator",
    description:
      "Tile count, adhesive, and grout for any floor or wall. Handles tile size, joint width, and wastage.",
    status: "live",
  },
];

export function calculatorHref(entry: CalculatorEntry, locale?: string): string {
  return locale ? `/${locale}/calculators/${entry.slug}` : `/calculators/${entry.slug}`;
}
