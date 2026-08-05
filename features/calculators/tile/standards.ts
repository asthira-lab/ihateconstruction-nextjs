// Tile standards registry — hard-coded on the frontend. Client + server safe.

import type {
  AdhesiveMethod,
  AreaQuantity,
  LengthQuantity,
  TileStandard,
} from "./types";

// Effective parameter set after merging preset + custom overrides.
export interface TileEffectiveParams {
  wastagePercent: string;
  adhesiveMethod: AdhesiveMethod;
  mortarBedThickness: LengthQuantity;
  mortarRatio: string;
  thinsetCoverage: AreaQuantity;
  groutWidth: LengthQuantity;
  groutDepth: LengthQuantity;
  tileThickness: LengthQuantity;
}

// Preset entry as exposed through GET /standards.
export interface TileStandardPreset {
  id: string;
  label: string;
  description: string;
  parameters: TileEffectiveParams;
}

export interface TileStandardsResponse {
  calculator: "tile";
  defaultPreset: string;
  presets: TileStandardPreset[];
  customizableKeys: (keyof TileEffectiveParams)[];
}

// Shared defaults so presets stay concise.
const DEFAULT_GROUT_WIDTH: LengthQuantity = { value: "3", unit: "mm" };
const DEFAULT_GROUT_DEPTH: LengthQuantity = { value: "8", unit: "mm" };
const DEFAULT_TILE_THICKNESS: LengthQuantity = { value: "8", unit: "mm" };
const DEFAULT_MORTAR_BED: LengthQuantity = { value: "20", unit: "mm" };

export const TILE_STANDARDS: TileStandardsResponse = {
  calculator: "tile",
  defaultPreset: "vitrified-floor",
  customizableKeys: [
    "wastagePercent",
    "adhesiveMethod",
    "mortarBedThickness",
    "mortarRatio",
    "thinsetCoverage",
    "groutWidth",
    "groutDepth",
    "tileThickness",
  ],
  presets: [
    {
      id: "vitrified-floor",
      label: "Vitrified floor tile",
      description: "Standard vitrified floor tile. Thin-set adhesive, 3mm grout.",
      parameters: {
        wastagePercent: "10",
        adhesiveMethod: "thin-set",
        mortarBedThickness: DEFAULT_MORTAR_BED,
        mortarRatio: "1:4",
        thinsetCoverage: { value: "1.5", unit: "sqm" },
        groutWidth: DEFAULT_GROUT_WIDTH,
        groutDepth: DEFAULT_GROUT_DEPTH,
        tileThickness: DEFAULT_TILE_THICKNESS,
      },
    },
    {
      id: "ceramic-wall",
      label: "Ceramic wall tile",
      description: "Ceramic wall tile, typically bathrooms/kitchens. Thin-set, 2mm grout.",
      parameters: {
        wastagePercent: "10",
        adhesiveMethod: "thin-set",
        mortarBedThickness: DEFAULT_MORTAR_BED,
        mortarRatio: "1:4",
        thinsetCoverage: { value: "1.8", unit: "sqm" },
        groutWidth: { value: "2", unit: "mm" },
        groutDepth: { value: "6", unit: "mm" },
        tileThickness: { value: "6", unit: "mm" },
      },
    },
    {
      id: "traditional-mortar-bed",
      label: "Traditional mortar bed installation",
      description: "20mm cement-sand mortar bed. Older installation method, still common in India.",
      parameters: {
        wastagePercent: "10",
        adhesiveMethod: "mortar-bed",
        mortarBedThickness: DEFAULT_MORTAR_BED,
        mortarRatio: "1:4",
        thinsetCoverage: { value: "1.5", unit: "sqm" },
        groutWidth: DEFAULT_GROUT_WIDTH,
        groutDepth: DEFAULT_GROUT_DEPTH,
        tileThickness: DEFAULT_TILE_THICKNESS,
      },
    },
  ],
};

export function findTilePreset(id: string): TileStandardPreset | undefined {
  return TILE_STANDARDS.presets.find((p) => p.id === id);
}

// Reject unknown keys inside `custom` — spec says UNKNOWN_CUSTOM_KEY.
const ALLOWED_CUSTOM_KEYS = new Set<keyof TileEffectiveParams>(TILE_STANDARDS.customizableKeys);

// Resolve preset + custom overrides to a concrete parameter set. Throws domain errors.
export function resolveTileStandard(std: TileStandard | undefined): {
  presetId: string;
  params: TileEffectiveParams;
} {
  const presetId = std?.preset ?? TILE_STANDARDS.defaultPreset;
  const found = findTilePreset(presetId);
  if (!found) throw new Error(`UNKNOWN_PRESET:${presetId}`);

  if (!std?.custom) return { presetId, params: found.parameters };

  // Reject keys not in the customizable set.
  for (const key of Object.keys(std.custom)) {
    if (!ALLOWED_CUSTOM_KEYS.has(key as keyof TileEffectiveParams)) {
      throw new Error(`UNKNOWN_CUSTOM_KEY:${key}`);
    }
  }

  const custom = std.custom;
  // Spec: groutDepth defaults to tile thickness. If the user overrode tileThickness
  // but not groutDepth, follow the new thickness; explicit groutDepth always wins.
  const groutDepth =
    custom.groutDepth ?? custom.tileThickness ?? found.parameters.groutDepth;
  const params: TileEffectiveParams = {
    wastagePercent: custom.wastagePercent ?? found.parameters.wastagePercent,
    adhesiveMethod: custom.adhesiveMethod ?? found.parameters.adhesiveMethod,
    mortarBedThickness: custom.mortarBedThickness ?? found.parameters.mortarBedThickness,
    mortarRatio: custom.mortarRatio ?? found.parameters.mortarRatio,
    thinsetCoverage: custom.thinsetCoverage ?? found.parameters.thinsetCoverage,
    groutWidth: custom.groutWidth ?? found.parameters.groutWidth,
    groutDepth,
    tileThickness: custom.tileThickness ?? found.parameters.tileThickness,
  };

  return { presetId, params };
}
