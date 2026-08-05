// Unit conversion helpers for the tile calculator. Internal math is SI.

import type {
  AreaQuantity,
  AreaUnit,
  LengthQuantity,
  LengthUnit,
  VolumeUnit,
} from "./types";

// Length: everything relative to 1 meter.
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

// Area: everything relative to 1 square meter.
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

// Overloads so the return type keeps the caller's literal unit.
export function asAreaQuantity(sqm: number, unit?: "sqm", decimals?: number): { value: string; unit: "sqm" };
export function asAreaQuantity(sqm: number, unit: "sqft", decimals?: number): { value: string; unit: "sqft" };
export function asAreaQuantity(
  sqm: number,
  unit: AreaUnit = "sqm",
  decimals = 2,
): AreaQuantity {
  return { value: (sqm * SQM_TO_UNIT[unit]).toFixed(decimals), unit };
}

// Volume: 1 cum = 35.3146667 cft.
const SQM_TIMES_M_TO_CFT = 35.3146667;

export function cumToUnit(cum: number, unit: VolumeUnit): number {
  return unit === "cum" ? cum : cum * SQM_TIMES_M_TO_CFT;
}

export function asVolumeQuantity(cum: number, unit: "cum", decimals?: number): { value: string; unit: "cum" };
export function asVolumeQuantity(cum: number, unit: "cft", decimals?: number): { value: string; unit: "cft" };
export function asVolumeQuantity(
  cum: number,
  unit: VolumeUnit,
  decimals = 4,
): { value: string; unit: VolumeUnit } {
  return { value: cumToUnit(cum, unit).toFixed(decimals), unit };
}

// Emit a length quantity in the same unit it came in as — used to echo effective params.
export function asLengthQuantity(
  meters: number,
  unit: LengthUnit,
  decimals = 2,
): LengthQuantity {
  const value = meters / LENGTH_TO_METERS[unit];
  return { value: value.toFixed(decimals), unit };
}
