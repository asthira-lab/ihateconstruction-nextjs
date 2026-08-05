/**
 * Standards registry — hard-coded on the frontend today. When the backend's
 * `GET /api/v1/calculators/brick/standards` endpoint ships, this file becomes
 * the type contract + fallback while the client-side cache warms up.
 *
 * Keep in sync with the spec's default preset parameters. If the backend
 * disagrees at runtime, the backend wins.
 *
 * Safe to import from client or server. No math, no I/O.
 */

import type { BrickRequest, LengthQuantity } from "./types";
import { assertCustomKeys } from "../errors";

/**
 * A single preset. Shape matches the spec's `GET /standards` response entry.
 * `parameters` is what feeds into the calculation when the user picks this
 * preset without overrides.
 *
 * Uses the general LengthQuantity type (not `unit: "mm"` literal) so custom
 * overrides in other units can flow through without a widening cast.
 */
export interface BrickStandardPreset {
  id: string;
  label: string;
  description: string;
  parameters: {
    brickSize: {
      length: LengthQuantity;
      width: LengthQuantity;
      height: LengthQuantity;
    };
    mortarThickness: LengthQuantity;
    mortarRatio: string;
    wastagePercent: string;
    mortarWastagePercent: string;
    mortarDryToWetFactor: string;
  };
}

export interface BrickStandardsResponse {
  calculator: "brick";
  defaultPreset: string;
  presets: BrickStandardPreset[];
  customizableKeys: (
    | "brickSize"
    | "mortarThickness"
    | "mortarRatio"
    | "wastagePercent"
    | "mortarWastagePercent"
    | "mortarDryToWetFactor"
  )[];
}

export const BRICK_STANDARDS: BrickStandardsResponse = {
  calculator: "brick",
  defaultPreset: "modular-indian",
  customizableKeys: [
    "brickSize",
    "mortarThickness",
    "mortarRatio",
    "wastagePercent",
    "mortarWastagePercent",
    "mortarDryToWetFactor",
  ],
  presets: [
    {
      id: "modular-indian",
      label: "Modular brick (190×90×90 mm)",
      description:
        "IS 1077 modular brick. Standard nominal size 200×100×100 with 10 mm joint.",
      parameters: {
        brickSize: {
          length: { value: "190", unit: "mm" },
          width: { value: "90", unit: "mm" },
          height: { value: "90", unit: "mm" },
        },
        mortarThickness: { value: "10", unit: "mm" },
        mortarRatio: "1:6",
        wastagePercent: "5",
        mortarWastagePercent: "20",
        mortarDryToWetFactor: "1.33",
      },
    },
    {
      id: "traditional-indian",
      label: "Traditional brick (230×110×75 mm)",
      description: "Common non-modular brick size used widely across India.",
      parameters: {
        brickSize: {
          length: { value: "230", unit: "mm" },
          width: { value: "110", unit: "mm" },
          height: { value: "75", unit: "mm" },
        },
        mortarThickness: { value: "10", unit: "mm" },
        mortarRatio: "1:6",
        wastagePercent: "5",
        mortarWastagePercent: "20",
        mortarDryToWetFactor: "1.33",
      },
    },
    {
      id: "aac-block-standard",
      label: "AAC block (600×200×200 mm)",
      description:
        "Autoclaved aerated concrete block. Larger unit, thinner joints.",
      parameters: {
        brickSize: {
          length: { value: "600", unit: "mm" },
          width: { value: "200", unit: "mm" },
          height: { value: "200", unit: "mm" },
        },
        mortarThickness: { value: "3", unit: "mm" },
        mortarRatio: "1:4",
        wastagePercent: "3",
        mortarWastagePercent: "10",
        mortarDryToWetFactor: "1.33",
      },
    },
  ],
};

/** Lookup helper; returns undefined for an unknown id (caller decides how to handle). */
export function findPreset(id: string): BrickStandardPreset | undefined {
  return BRICK_STANDARDS.presets.find((p) => p.id === id);
}

/**
 * Resolve the request's `standard` field to a concrete parameter set. Applies
 * `custom` overrides on top of the preset. Throws a domain error string that
 * the caller maps to `UNKNOWN_PRESET`.
 */
export function resolveStandard(std: BrickRequest["standard"]): BrickStandardPreset["parameters"] {
  const presetId = std?.preset ?? BRICK_STANDARDS.defaultPreset;
  const preset = findPreset(presetId);
  if (!preset) throw new Error(`UNKNOWN_PRESET:${presetId}`);
  if (!std?.custom) return preset.parameters;

  assertCustomKeys(std.custom, BRICK_STANDARDS.customizableKeys);

  return {
    brickSize: std.custom.brickSize ?? preset.parameters.brickSize,
    mortarThickness: std.custom.mortarThickness ?? preset.parameters.mortarThickness,
    mortarRatio: std.custom.mortarRatio ?? preset.parameters.mortarRatio,
    wastagePercent: std.custom.wastagePercent ?? preset.parameters.wastagePercent,
    mortarWastagePercent:
      std.custom.mortarWastagePercent ?? preset.parameters.mortarWastagePercent,
    mortarDryToWetFactor:
      std.custom.mortarDryToWetFactor ?? preset.parameters.mortarDryToWetFactor,
  };
}
