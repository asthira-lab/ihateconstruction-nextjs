// Steel weight math. Server-only.

import "server-only";

import type { SteelBar, WeightPerMetreFormula } from "./types";
import { lengthToMeters } from "./units";

// Whitelist evaluators for weight-per-metre formulas.
// Adding a new one? Update weightPerMetreFormulaSchema in schema.ts too.
const FORMULA_EVALUATORS: Record<
  WeightPerMetreFormula,
  (diameterMm: number) => number
> = {
  "d^2 / 162": (d) => (d * d) / 162,
  "d^2 / 162.28": (d) => (d * d) / 162.28,
};

export function weightPerMetre(
  diameterMm: number,
  formula: WeightPerMetreFormula,
): number {
  const fn = FORMULA_EVALUATORS[formula];
  // Zod guarantees a whitelisted value at this point, but guard anyway.
  if (!fn) throw new Error(`UNKNOWN_CUSTOM_KEY:weightPerMetreFormula`);
  return fn(diameterMm);
}

export interface BarWeight {
  weightPerMetreKg: number;
  totalLengthM: number;
  weightKg: number;
}

export function computeBarWeight(
  bar: SteelBar,
  formula: WeightPerMetreFormula,
): BarWeight {
  const diameterMm = Number(bar.diameter.value);
  const lengthM = lengthToMeters(bar.length);
  const weightPerMetreKg = weightPerMetre(diameterMm, formula);
  const totalLengthM = lengthM * bar.count;
  const weightKg = weightPerMetreKg * totalLengthM;
  return { weightPerMetreKg, totalLengthM, weightKg };
}

export interface BarScheduleTotals {
  weightBeforeWastageKg: number;
  wastageKg: number;
  totalWeightKg: number;
}

export function applyWastage(
  weightBeforeKg: number,
  wastagePercentStr: string,
): BarScheduleTotals {
  const pct = Number(wastagePercentStr);
  const wastageKg = weightBeforeKg * (pct / 100);
  return {
    weightBeforeWastageKg: weightBeforeKg,
    wastageKg,
    totalWeightKg: weightBeforeKg + wastageKg,
  };
}
