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
  keywords?: string[];
}

export const CALCULATORS: CalculatorEntry[] = [
  {
    slug: "cement-calculator",
    title: "Cement calculator",
    description:
      "Bags of cement for a slab, post hole, or any volume. Supports 94 lb Portland, 50 kg, and sand-and-cement mixes.",
    status: "live",
    keywords: ["cement bags", "portland cement", "cement for slab", "post hole cement", "sand cement mix", "mortar cement", "50kg cement", "94lb cement"],
  },
  {
    slug: "brick-calculator",
    title: "Brick calculator",
    description:
      "Bricks, mortar, cement, and sand for any wall, patio, paver, or fire pit. Supports modular, traditional, red brick, fire brick, and AAC.",
    status: "live",
    keywords: ["brick wall", "brick patio", "brick paver", "fire pit bricks", "modular brick", "traditional brick", "aac block", "brick mortar", "brick count"],
  },
  {
    slug: "concrete-calculator",
    title: "Concrete calculator",
    description:
      "Cement, sand, and aggregate for a given volume and mix ratio (M15, M20, M25, custom).",
    status: "live",
    keywords: ["concrete mix", "m15 m20 m25", "cement sand aggregate", "concrete grade", "mix ratio", "concrete materials"],
  },
  {
    slug: "steel-calculator",
    title: "Steel calculator",
    description:
      "Reinforcement weight for beams, columns, and slabs from a bar schedule.",
    status: "live",
    keywords: ["steel weight", "tmt bar", "reinforcement steel", "bar schedule", "steel for slab", "steel for beam", "steel for column"],
  },
  {
    slug: "paint-calculator",
    title: "Paint calculator",
    description:
      "Litres of paint for interior or exterior walls, factoring surface area, coats, and coverage.",
    status: "live",
    keywords: ["paint litres", "wall paint", "interior paint", "exterior paint", "paint coverage", "paint coats", "primer paint", "emulsion paint"],
  },
  {
    slug: "tile-calculator",
    title: "Tile calculator",
    description:
      "Tile count, adhesive, and grout for any floor or wall. Handles tile size, joint width, and wastage.",
    status: "live",
    keywords: ["floor tiles", "wall tiles", "tile adhesive", "tile grout", "tile count", "vitrified tiles", "ceramic tiles", "thin-set", "mortar bed"],
  },
  {
    slug: "rebar-calculator",
    title: "Rebar calculator",
    description:
      "Rebar grid for a slab, footing, wall, or foundation — bar count each way, total length, pieces, and weight from size, spacing, and edge cover.",
    status: "live",
    keywords: ["rebar grid", "rebar slab", "rebar footing", "rebar wall", "rebar spacing", "rebar cover", "rebar weight", "rebar pieces", "12m rebar"],
  },
  {
    slug: "concrete-volume-calculator",
    title: "Concrete volume calculator",
    description:
      "Cubic yards, cubic feet, or cubic metres of concrete for a slab, footing, wall, or post hole from length, width, and depth.",
    status: "live",
    keywords: ["concrete volume", "cubic yards concrete", "cubic feet concrete", "cubic metres concrete", "concrete yardage", "slab volume", "footing volume", "wall volume", "post hole volume"],
  },
  {
    slug: "concrete-slab-calculator",
    title: "Concrete slab calculator",
    description:
      "Concrete for a rectangular slab from length, width, and thickness — cubic yards, premix bags (80 lb / 60 lb), weight, and ready-mix truck loads.",
    status: "live",
    keywords: ["slab concrete", "concrete slab", "premix bags", "ready mix concrete", "slab thickness", "concrete truck", "80lb bag", "60lb bag"],
  },
  {
    slug: "concrete-foundation-calculator",
    title: "Concrete foundation calculator",
    description:
      "Concrete for a continuous strip footing — plus an optional stem wall — from run length, footing width and depth. Cubic yards, premix bags, weight, and ready-mix truck loads.",
    status: "live",
    keywords: ["foundation concrete", "strip footing", "stem wall", "continuous footing", "footing concrete", "foundation volume"],
  },
  {
    slug: "concrete-footing-calculator",
    title: "Concrete footing calculator",
    description:
      "Concrete for continuous wall footings, spread pad footings, and circular pier footings — cubic yards, premix bags (80 lb / 60 lb), weight, and truck loads.",
    status: "live",
    keywords: ["footing concrete", "wall footing", "pad footing", "pier footing", "spread footing", "circular footing", "footing bags"],
  },
  {
    slug: "concrete-wall-calculator",
    title: "Concrete wall calculator",
    description:
      "Concrete for a wall from length, height, and thickness — cubic yards, premix bags (80 lb / 60 lb), weight, and ready-mix truck loads.",
    status: "live",
    keywords: ["wall concrete", "retaining wall", "concrete wall volume", "wall yardage", "concrete wall bags", "wall thickness"],
  },
];

export function calculatorHref(entry: CalculatorEntry, locale?: string): string {
  return locale ? `/${locale}/calculators/${entry.slug}` : `/calculators/${entry.slug}`;
}
