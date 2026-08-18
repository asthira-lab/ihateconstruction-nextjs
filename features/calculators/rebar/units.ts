// Unit conversion helpers. All internal math in SI (m, kg).

import type { LengthQuantity, LengthUnit } from "./types";

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

export function metersToSqft(m2: number): number {
  return m2 * 10.7639;
}

export function asMeters(meters: number, decimals = 2): { value: string; unit: "m" } {
  return { value: meters.toFixed(decimals), unit: "m" };
}

export function asKg(kg: number, decimals = 2): { value: string; unit: "kg" } {
  return { value: kg.toFixed(decimals), unit: "kg" };
}
