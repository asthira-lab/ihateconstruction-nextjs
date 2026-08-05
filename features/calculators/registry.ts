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
    slug: "brick",
    title: "Brick calculator",
    description:
      "Bricks, mortar, cement, and sand for any wall. Supports modular, traditional, and AAC block presets.",
    status: "live",
  },
  {
    slug: "concrete",
    title: "Concrete calculator",
    description:
      "Cement, sand, and aggregate for a given volume and mix ratio (M15, M20, M25, custom).",
    status: "live",
  },
  {
    slug: "steel",
    title: "Steel calculator",
    description:
      "Reinforcement weight for beams, columns, and slabs from a bar schedule.",
    status: "live",
  },
  {
    slug: "paint",
    title: "Paint calculator",
    description:
      "Litres of paint for interior or exterior walls, factoring surface area, coats, and coverage.",
    status: "live",
  },
  {
    slug: "tile",
    title: "Tile calculator",
    description:
      "Tile count, adhesive, and grout for any floor or wall. Handles tile size, joint width, and wastage.",
    status: "live",
  },
];

export function calculatorHref(entry: CalculatorEntry): string {
  return `/calculators/${entry.slug}`;
}
