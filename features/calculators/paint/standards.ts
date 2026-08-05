/**
 * Paint standards registry — hard-coded on the frontend today.
 *
 * Six presets covering the paint products contractors quote most often on
 * Indian job sites: interior + exterior emulsions, enamel for woodwork /
 * metal, two primers, and wall putty.
 *
 * Coverage numbers are indicative — real coverage varies wildly by brand,
 * surface texture, dilution, and whether it's the first coat or a re-coat.
 * The response echoes back the exact coverage used so the estimate is
 * reproducible even if a user later disagrees with the default.
 *
 * Safe to import from client or server. No math, no I/O.
 */

import type { AreaQuantity, LayerStandard } from "./types";
import { assertCustomKeys } from "../errors";

/**
 * A single preset. Shape matches the spec's `GET /standards` response entry.
 * `parameters` feeds into the layer's calculation when the user picks this
 * preset without overrides.
 *
 * Putty-kind presets output kilograms; paint-kind presets output litres. The
 * discriminant lets the compute layer branch cleanly and lets the client
 * render the right unit in the UI without duplicating the layer-type check.
 */
export type PaintStandardPreset =
  | {
      id: string;
      label: string;
      description: string;
      kind: "paint";
      parameters: {
        coveragePerLitre: AreaQuantity;
        wastagePercent: string;
      };
    }
  | {
      id: string;
      label: string;
      description: string;
      kind: "putty";
      parameters: {
        kgPerSqm: string;
        wastagePercent: string;
      };
    };

export interface PaintStandardsResponse {
  calculator: "paint";
  defaultPreset: string;
  presets: PaintStandardPreset[];
  customizableKeys: ("coveragePerLitre" | "kgPerSqm" | "wastagePercent")[];
}

function paintPreset(
  id: string,
  label: string,
  description: string,
  coverageSqm: string,
  wastagePercent: string,
): PaintStandardPreset {
  return {
    id,
    label,
    description,
    kind: "paint",
    parameters: {
      coveragePerLitre: { value: coverageSqm, unit: "sqm" },
      wastagePercent,
    },
  };
}

function puttyPreset(
  id: string,
  label: string,
  description: string,
  kgPerSqm: string,
  wastagePercent: string,
): PaintStandardPreset {
  return {
    id,
    label,
    description,
    kind: "putty",
    parameters: {
      kgPerSqm,
      wastagePercent,
    },
  };
}

export const PAINT_STANDARDS: PaintStandardsResponse = {
  calculator: "paint",
  defaultPreset: "interior-emulsion",
  customizableKeys: ["coveragePerLitre", "kgPerSqm", "wastagePercent"],
  presets: [
    paintPreset(
      "interior-emulsion",
      "Interior emulsion",
      "Water-based emulsion for interior walls. Coverage ~11–14 sqm/L.",
      "12",
      "5",
    ),
    paintPreset(
      "exterior-emulsion",
      "Exterior emulsion",
      "Weatherproof exterior finish. Coverage ~8–11 sqm/L on rough surfaces.",
      "9",
      "7",
    ),
    paintPreset(
      "enamel",
      "Enamel paint",
      "Oil-based, glossy. For woodwork and metal. ~14–16 sqm/L on smooth surfaces.",
      "15",
      "5",
    ),
    paintPreset(
      "acrylic-primer",
      "Acrylic primer",
      "Water-based primer for interior walls. ~9–11 sqm/L.",
      "10",
      "5",
    ),
    paintPreset(
      "cement-primer",
      "Cement primer",
      "Solvent-based primer for exterior. ~8–10 sqm/L.",
      "9",
      "7",
    ),
    puttyPreset(
      "wall-putty",
      "Wall putty",
      "White-cement / acrylic wall putty (Birla-style). ~1.2 kg per sqm per coat.",
      "1.2",
      "10",
    ),
  ],
};

/** Lookup helper; returns undefined for an unknown id (caller decides how to handle). */
export function findPaintPreset(id: string): PaintStandardPreset | undefined {
  return PAINT_STANDARDS.presets.find((p) => p.id === id);
}

/**
 * Resolve one layer's `standard` block to a concrete parameter set. Applies
 * `custom` overrides on top of the preset. Throws a domain error string that
 * the caller maps to `UNKNOWN_PRESET`.
 *
 * Returns the discriminated preset — callers branch on `.kind` to know
 * whether they are computing litres or kilograms.
 */
export function resolvePaintStandard(
  std: LayerStandard | undefined,
): PaintStandardPreset {
  const presetId = std?.preset ?? PAINT_STANDARDS.defaultPreset;
  const found = findPaintPreset(presetId);
  if (!found) throw new Error(`UNKNOWN_PRESET:${presetId}`);
  if (!std?.custom) return found;

  assertCustomKeys(std.custom, PAINT_STANDARDS.customizableKeys);

  if (found.kind === "putty") {
    return {
      ...found,
      parameters: {
        kgPerSqm: std.custom.kgPerSqm ?? found.parameters.kgPerSqm,
        wastagePercent:
          std.custom.wastagePercent ?? found.parameters.wastagePercent,
      },
    };
  }
  return {
    ...found,
    parameters: {
      coveragePerLitre:
        std.custom.coveragePerLitre ?? found.parameters.coveragePerLitre,
      wastagePercent:
        std.custom.wastagePercent ?? found.parameters.wastagePercent,
    },
  };
}
