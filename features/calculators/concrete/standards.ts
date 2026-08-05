/**
 * Concrete standards registry — mirrors the backend's
 * `GET /api/v1/calculators/concrete/standards` response.
 *
 * Frontend acts as the source of truth today; once the backend endpoint is
 * live this file becomes the type contract + startup cache. If the backend
 * disagrees at runtime, the backend wins.
 *
 * Design mixes (M30+) intentionally excluded from Phase 1. Design mixes
 * require lab-proportioned material, not a fixed volumetric ratio; showing
 * a fixed ratio would mislead. Add when we have the caveats to present with it.
 *
 * Safe to import from client or server. No math, no I/O.
 */

import type { ConcreteRequest, MassQuantity } from "./types";
import { assertCustomKeys } from "../errors";

export interface ConcreteStandardPreset {
  id: string;
  label: string;
  description: string;
  parameters: {
    mixRatio: string;
    wastagePercent: string;
    cementDensity: MassQuantity;
    cementBagWeight: MassQuantity;
    dryToWetFactor: string;
  };
}

export interface ConcreteStandardsResponse {
  calculator: "concrete";
  defaultPreset: string;
  presets: ConcreteStandardPreset[];
  customizableKeys: (
    | "mixRatio"
    | "wastagePercent"
    | "cementDensity"
    | "cementBagWeight"
    | "dryToWetFactor"
  )[];
}

// Default parameters — same for every preset today. Overridable per-request
// via `standard.custom`. Kept as a single reference so we can adjust one
// value (e.g. cement bulk density) and every preset picks it up.
const DEFAULT_CEMENT_DENSITY: MassQuantity = { value: "1440", unit: "kg" };
const DEFAULT_CEMENT_BAG_WEIGHT: MassQuantity = { value: "50", unit: "kg" };
const DEFAULT_DRY_TO_WET = "1.54";
const DEFAULT_WASTAGE_PERCENT = "3";

function preset(
  id: string,
  label: string,
  description: string,
  mixRatio: string,
): ConcreteStandardPreset {
  return {
    id,
    label,
    description,
    parameters: {
      mixRatio,
      wastagePercent: DEFAULT_WASTAGE_PERCENT,
      cementDensity: DEFAULT_CEMENT_DENSITY,
      cementBagWeight: DEFAULT_CEMENT_BAG_WEIGHT,
      dryToWetFactor: DEFAULT_DRY_TO_WET,
    },
  };
}

export const CONCRETE_STANDARDS: ConcreteStandardsResponse = {
  calculator: "concrete",
  defaultPreset: "M20",
  customizableKeys: [
    "mixRatio",
    "wastagePercent",
    "cementDensity",
    "cementBagWeight",
    "dryToWetFactor",
  ],
  presets: [
    preset(
      "M5",
      "M5 (1:5:10)",
      "Lean concrete. Bedding, non-structural fill.",
      "1:5:10",
    ),
    preset(
      "M7.5",
      "M7.5 (1:4:8)",
      "Non-structural. Screed, mass concrete.",
      "1:4:8",
    ),
    preset(
      "M10",
      "M10 (1:3:6)",
      "Plain concrete (PCC), non-load-bearing.",
      "1:3:6",
    ),
    preset(
      "M15",
      "M15 (1:2:4)",
      "PCC in foundations, light-load RCC.",
      "1:2:4",
    ),
    preset(
      "M20",
      "M20 (1:1.5:3)",
      "General RCC — slabs, beams, columns for light-to-moderate loading.",
      "1:1.5:3",
    ),
    preset(
      "M25",
      "M25 (1:1:2)",
      "RCC for moderate loads. Common minimum for structural elements per IS 456.",
      "1:1:2",
    ),
  ],
};

/** Lookup helper — caller decides how to handle a miss. */
export function findConcretePreset(id: string): ConcreteStandardPreset | undefined {
  return CONCRETE_STANDARDS.presets.find((p) => p.id === id);
}

/**
 * Resolve the request's `standard` block to a full parameter set — preset
 * defaults with `custom` overrides layered on top.
 *
 * Throws a bare-string error (`UNKNOWN_PRESET:<id>`) that the calling server
 * action's `normalizeError` maps to the API's error shape.
 */
export function resolveConcreteStandard(
  std: ConcreteRequest["standard"],
): ConcreteStandardPreset["parameters"] {
  const presetId = std?.preset ?? CONCRETE_STANDARDS.defaultPreset;
  const found = findConcretePreset(presetId);
  if (!found) throw new Error(`UNKNOWN_PRESET:${presetId}`);
  if (!std?.custom) return found.parameters;

  assertCustomKeys(std.custom, CONCRETE_STANDARDS.customizableKeys);

  return {
    mixRatio: std.custom.mixRatio ?? found.parameters.mixRatio,
    wastagePercent: std.custom.wastagePercent ?? found.parameters.wastagePercent,
    cementDensity: std.custom.cementDensity ?? found.parameters.cementDensity,
    cementBagWeight:
      std.custom.cementBagWeight ?? found.parameters.cementBagWeight,
    dryToWetFactor: std.custom.dryToWetFactor ?? found.parameters.dryToWetFactor,
  };
}
