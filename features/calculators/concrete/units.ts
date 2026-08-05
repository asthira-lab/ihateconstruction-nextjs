/**
 * Unit conversion helpers for concrete quantities.
 *
 * Pure functions, no I/O, no secrets — safe to import from client or server.
 * All internal math runs in SI (cubic meters for volume, kilograms for mass).
 * Conversion happens on the way in and formatting on the way out.
 */

import type {
  AggregateOutputUnit,
  MassQuantity,
  SandOutputUnit,
  VolumeQuantity,
  VolumeUnit,
} from "./types";

// --- volume -------------------------------------------------------------

const VOLUME_TO_CUM: Record<VolumeUnit, number> = {
  cum: 1,
  cft: 0.0283168466, // 1 cubic foot in cubic meters
};

const CUM_TO_UNIT: Record<VolumeUnit, number> = {
  cum: 1,
  cft: 35.3146667,
};

export function volumeToCum(q: VolumeQuantity): number {
  return Number(q.value) * VOLUME_TO_CUM[q.unit];
}

export function cumTo(unit: VolumeUnit, cum: number): number {
  return cum * CUM_TO_UNIT[unit];
}

export function asVolumeQuantity(
  cum: number,
  unit: VolumeUnit = "cum",
  decimals = 2,
): VolumeQuantity {
  const value = cum * CUM_TO_UNIT[unit];
  return { value: value.toFixed(decimals), unit };
}

// --- mass ---------------------------------------------------------------

export function massToKg(q: MassQuantity): number {
  // Backend accepts kg only today; if that expands we widen this switch.
  return Number(q.value);
}

export function asMassQuantity(kg: number, decimals = 0): MassQuantity {
  return { value: kg.toFixed(decimals), unit: "kg" };
}

// --- output-unit helpers ------------------------------------------------

/**
 * Convert a cubic-meter volume of sand/aggregate to whichever output unit
 * the user asked for. `bulkDensityKgPerCum` is only consulted when the
 * output unit is kg — sand and aggregate ship in cft or cum by default.
 */
export function volumeToOutput(
  cum: number,
  unit: SandOutputUnit | AggregateOutputUnit,
  bulkDensityKgPerCum: number,
): { value: number; unit: SandOutputUnit | AggregateOutputUnit } {
  switch (unit) {
    case "cum":
      return { value: cum, unit };
    case "cft":
      return { value: cum * CUM_TO_UNIT.cft, unit };
    case "kg":
      return { value: cum * bulkDensityKgPerCum, unit };
  }
}
