// Unit conversion helpers. All internal math in SI (m, cum, kg).

import type {
  LengthQuantity,
  LengthUnit,
  MassQuantity,
  VolumeQuantity,
  VolumeUnit,
} from "./types";

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

const VOLUME_TO_CUM: Record<VolumeUnit, number> = {
  cum: 1,
  cft: 0.0283168466,
};

export function volumeToCum(q: VolumeQuantity): number {
  return Number(q.value) * VOLUME_TO_CUM[q.unit];
}

export function massToKg(q: MassQuantity): number {
  return Number(q.value);
}

export function asMassQuantity(kg: number, decimals = 2): MassQuantity {
  return { value: kg.toFixed(decimals), unit: "kg" };
}

export function asLengthMeters(
  meters: number,
  decimals = 2,
): { value: string; unit: "m" } {
  return { value: meters.toFixed(decimals), unit: "m" };
}
