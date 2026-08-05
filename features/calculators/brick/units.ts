/**
 * Unit conversion helpers.
 *
 * All calculations happen in **SI base units**: meters (length), cubic meters
 * (volume). Convert on the way in and format on the way out — never do math
 * in mixed units.
 *
 * Safe to import from either server or client code. No secrets, no I/O.
 */

import type { LengthQuantity, LengthUnit, VolumeQuantity, VolumeUnit } from "./types";

// --- length: everything relative to 1 meter ------------------------------

const LENGTH_TO_METERS: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  ft: 0.3048,
  in: 0.0254,
};

export function lengthToMeters(q: LengthQuantity): number {
  const factor = LENGTH_TO_METERS[q.unit];
  const n = Number(q.value);
  return n * factor;
}

/** Format meters as a fixed-precision string. Result units are always meters. */
export function metersToString(m: number, decimals = 2): string {
  return m.toFixed(decimals);
}

// --- volume: everything relative to 1 cubic meter ------------------------

const VOLUME_TO_CUM: Record<VolumeUnit, number> = {
  cum: 1,
  cft: 0.0283168466, // 1 cubic foot in cubic meters
};

const CUM_TO_UNIT: Record<VolumeUnit, number> = {
  cum: 1,
  cft: 35.3146667, // 1 cubic meter in cubic feet
};

export function volumeToCum(q: VolumeQuantity): number {
  const factor = VOLUME_TO_CUM[q.unit];
  return Number(q.value) * factor;
}

export function cumTo(unit: VolumeUnit, cum: number): number {
  return cum * CUM_TO_UNIT[unit];
}

// --- formatting for the API's stringified Quantity shape ----------------

export function asLengthQuantity(meters: number, unit: LengthUnit = "m", decimals = 2): LengthQuantity {
  const value = meters / LENGTH_TO_METERS[unit];
  return { value: value.toFixed(decimals), unit };
}

export function asVolumeQuantity(cum: number, unit: VolumeUnit = "cum", decimals = 2): VolumeQuantity {
  const value = cum * CUM_TO_UNIT[unit];
  return { value: value.toFixed(decimals), unit };
}
