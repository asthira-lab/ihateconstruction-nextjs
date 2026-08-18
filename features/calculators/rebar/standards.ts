// Resolution helpers for the rebar calculator's configurable defaults.
// The only user-overridable parameter is wastage %.

import { DEFAULT_WASTAGE_PERCENT } from "./sizes";
import { assertCustomKeys } from "../errors";

export const REBAR_CUSTOMIZABLE_KEYS = ["wastagePercent"] as const;

// Resolves the effective wastage % from an optional `custom` override object,
// falling back to the default. Rejects unknown keys so silent-math bugs surface.
export function resolveWastage(custom: Record<string, unknown> | undefined): string {
  assertCustomKeys(custom, REBAR_CUSTOMIZABLE_KEYS);
  const value = custom?.wastagePercent;
  return value !== undefined && value !== "" ? String(value) : DEFAULT_WASTAGE_PERCENT;
}
