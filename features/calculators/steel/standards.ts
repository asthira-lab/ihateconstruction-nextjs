// Preset registry + resolve() for the steel calculator.

import type {
  MassQuantity,
  Member,
  SteelStandard,
  WeightPerMetreFormula,
} from "./types";
import { assertCustomKeys } from "../errors";

export interface SteelStandardPreset {
  id: string;
  label: string;
  description: string;
  parameters: {
    steelDensity: MassQuantity;
    wastagePercent: string;
    weightPerMetreFormula: WeightPerMetreFormula;
  };
}

export interface SteelStandardsResponse {
  calculator: "steel";
  defaultPreset: string;
  presets: SteelStandardPreset[];
  customizableKeys: (
    | "steelDensity"
    | "wastagePercent"
    | "weightPerMetreFormula"
    | "thumbRuleKgPerCum"
  )[];
  thumbRuleDefaults: Record<Member, { value: string; unit: "kg/cum" }>;
}

const DEFAULT_DENSITY: MassQuantity = { value: "7850", unit: "kg" };
const DEFAULT_WASTAGE = "3";
const DEFAULT_FORMULA: WeightPerMetreFormula = "d^2 / 162";

function preset(
  id: string,
  label: string,
  description: string,
): SteelStandardPreset {
  return {
    id,
    label,
    description,
    parameters: {
      steelDensity: DEFAULT_DENSITY,
      wastagePercent: DEFAULT_WASTAGE,
      weightPerMetreFormula: DEFAULT_FORMULA,
    },
  };
}

export const STEEL_STANDARDS: SteelStandardsResponse = {
  calculator: "steel",
  defaultPreset: "IS-1786",
  customizableKeys: [
    "steelDensity",
    "wastagePercent",
    "weightPerMetreFormula",
    "thumbRuleKgPerCum",
  ],
  presets: [
    preset(
      "IS-1786",
      "IS 1786 (Fe 500 TMT — Indian standard)",
      "Standard HYSD/TMT reinforcement bars used in India.",
    ),
    preset(
      "IS-1786-Fe550",
      "IS 1786 (Fe 550 TMT)",
      "Higher-grade TMT bars. Same weight formula.",
    ),
  ],
  thumbRuleDefaults: {
    slab: { value: "80", unit: "kg/cum" },
    beam: { value: "100", unit: "kg/cum" },
    column: { value: "130", unit: "kg/cum" },
    footing: { value: "70", unit: "kg/cum" },
    staircase: { value: "130", unit: "kg/cum" },
  },
};

export function findSteelPreset(id: string): SteelStandardPreset | undefined {
  return STEEL_STANDARDS.presets.find((p) => p.id === id);
}

// Resolves preset + custom overrides for barSchedule mode.
export function resolveSteelStandard(
  std: SteelStandard | undefined,
): {
  presetId: string;
  steelDensity: MassQuantity;
  wastagePercent: string;
  weightPerMetreFormula: WeightPerMetreFormula;
} {
  const presetId = std?.preset ?? STEEL_STANDARDS.defaultPreset;
  const found = findSteelPreset(presetId);
  if (!found) throw new Error(`UNKNOWN_PRESET:${presetId}`);
  const p = found.parameters;
  const custom = std?.custom;
  assertCustomKeys(custom, STEEL_STANDARDS.customizableKeys);
  return {
    presetId,
    steelDensity: custom?.steelDensity ?? p.steelDensity,
    wastagePercent: custom?.wastagePercent ?? p.wastagePercent,
    weightPerMetreFormula:
      custom?.weightPerMetreFormula ?? p.weightPerMetreFormula,
  };
}

// Resolves thumb-rule parameters: kg/cum for the member, plus wastage.
export function resolveThumbRuleStandard(
  member: Member,
  std: SteelStandard | undefined,
): { kgPerCum: string; wastagePercent: string } {
  const custom = std?.custom;
  assertCustomKeys(custom, STEEL_STANDARDS.customizableKeys);
  const kgPerCum =
    custom?.thumbRuleKgPerCum ??
    STEEL_STANDARDS.thumbRuleDefaults[member].value;
  // If a preset is given, honour its wastage; otherwise default.
  let wastagePercent = DEFAULT_WASTAGE;
  if (std?.preset) {
    const found = findSteelPreset(std.preset);
    if (!found) throw new Error(`UNKNOWN_PRESET:${std.preset}`);
    wastagePercent = found.parameters.wastagePercent;
  }
  if (custom?.wastagePercent !== undefined) {
    wastagePercent = custom.wastagePercent;
  }
  return { kgPerCum, wastagePercent };
}
