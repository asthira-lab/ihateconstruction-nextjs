// Rebar grid + weight math. Server-only.

import "server-only";

// Standard weight-per-metre shortcut for a round steel bar of diameter D mm.
// kg/m ≈ π × (D/2)² × 7850 kg/cum ÷ 10⁶ ≈ D² / 162.28 (round 162 in the field).
export function weightPerMetreKg(diameterMm: number, perMetreDenominator = 162): number {
  return (diameterMm * diameterMm) / perMetreDenominator;
}

export interface GridResult {
  gridLengthM: number;
  gridWidthM: number;
  longitudinalCount: number;
  transverseCount: number;
  totalLengthM: number;
}

// Rebar grid over a rectangular member.
//   - Edge cover is subtracted from both ends of each dimension.
//   - Bars running parallel to the length are placed across the grid width.
//   - Bars running parallel to the width are placed across the grid length.
//   - Each direction gets one more bar line than the number of spacing gaps.
export function computeRebarGrid(
  lengthM: number,
  widthM: number,
  spacingM: number,
  edgeM: number,
): GridResult {
  if (spacingM <= 0) throw new Error("UNKNOWN_CUSTOM_KEY:spacing");
  const gridLengthM = Math.max(0, lengthM - 2 * edgeM);
  const gridWidthM = Math.max(0, widthM - 2 * edgeM);

  const longitudinalCount = Math.max(0, Math.floor(gridWidthM / spacingM) + 1);
  const transverseCount = Math.max(0, Math.floor(gridLengthM / spacingM) + 1);

  const totalLengthM =
    longitudinalCount * gridLengthM + transverseCount * gridWidthM;

  return { gridLengthM, gridWidthM, longitudinalCount, transverseCount, totalLengthM };
}

export function rebarPieces(totalLengthM: number, barLengthM: number): number {
  if (barLengthM <= 0) throw new Error("UNKNOWN_CUSTOM_KEY:barLength");
  return Math.ceil(totalLengthM / barLengthM);
}

export interface WeightTotals {
  weightBeforeKg: number;
  wastageKg: number;
  totalWeightKg: number;
}

export function applyWastage(weightBeforeKg: number, wastagePercent: string): WeightTotals {
  const pct = Number(wastagePercent) || 0;
  const wastageKg = weightBeforeKg * (pct / 100);
  return {
    weightBeforeKg,
    wastageKg,
    totalWeightKg: weightBeforeKg + wastageKg,
  };
}
