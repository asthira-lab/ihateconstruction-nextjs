/**
 * Unit conversion helpers for the paint calculator.
 *
 * All internal math runs in SI base units (meters for length, square meters
 * for area). Convert on the way in and format on the way out — never mix
 * units mid-calculation.
 *
 * Safe to import from either server or client code. No secrets, no I/O.
 */

import type {
  AreaQuantity,
  AreaUnit,
  LengthQuantity,
  LengthUnit,
  PaintMassQuantity,
  PaintMassUnit,
  PaintVolumeQuantity,
  PaintVolumeUnit,
} from "./types";

// --- length: everything relative to 1 meter -----------------------------

const LENGTH_TO_METERS: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  ft: 0.3048,
  in: 0.0254,
};

export function lengthToMeters(q: LengthQuantity): number {
  return Number(q.value) * LENGTH_TO_METERS[q.unit];
}

// --- area: everything relative to 1 square meter -------------------------

// 1 sqft = 0.09290304 sqm (exactly, since 1 ft = 0.3048 m).
const AREA_TO_SQM: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 0.09290304,
};

const SQM_TO_UNIT: Record<AreaUnit, number> = {
  sqm: 1,
  sqft: 10.7639104,
};

export function areaToSqm(q: AreaQuantity): number {
  return Number(q.value) * AREA_TO_SQM[q.unit];
}

export function asAreaQuantity(
  sqm: number,
  unit?: "sqm",
  decimals?: number,
): { value: string; unit: "sqm" };
export function asAreaQuantity(
  sqm: number,
  unit: "sqft",
  decimals?: number,
): { value: string; unit: "sqft" };
export function asAreaQuantity(
  sqm: number,
  unit: AreaUnit = "sqm",
  decimals = 2,
): AreaQuantity {
  const value = sqm * SQM_TO_UNIT[unit];
  return { value: value.toFixed(decimals), unit };
}

// --- paint volume (litres) ----------------------------------------------

// Litres is the only supported unit today. Symmetric helper for the on-the-
// way-out formatting so response construction reads uniformly.
export function asPaintVolumeQuantity(
  litres: number,
  unit: PaintVolumeUnit = "litre",
  decimals = 2,
): PaintVolumeQuantity {
  return { value: litres.toFixed(decimals), unit };
}

// Kilograms — used for putty layers whose output is a mass, not a volume.
export function asPaintMassQuantity(
  kg: number,
  unit: PaintMassUnit = "kg",
  decimals = 2,
): PaintMassQuantity {
  return { value: kg.toFixed(decimals), unit };
}
