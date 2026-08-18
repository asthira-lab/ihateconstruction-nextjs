// Unit conversions used by both the form and the compute step.

import type { LengthQuantity } from "./types";

const METERS_PER: Record<LengthQuantity["unit"], number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  ft: 0.3048,
  in: 0.0254,
};

export function lengthToMeters(q: LengthQuantity): number {
  const n = Number(q.value);
  if (!Number.isFinite(n)) return NaN;
  return n * METERS_PER[q.unit];
}
