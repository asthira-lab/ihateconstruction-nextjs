// Canonical server-side implementation of the tile calculator.

import "server-only";

import {
  computeGrout,
  computeMortarBed,
  computeSurfaceAreas,
  computeThinSetKg,
  computeTileCounts,
} from "./formula";
import { resolveTileStandard, type TileEffectiveParams } from "./standards";
import { asAreaQuantity, asVolumeQuantity, cumToUnit } from "./units";
import type { TileRequest, TileResponse } from "./types";

export async function computeTileOnServer(req: TileRequest): Promise<TileResponse> {
  // 1. Surface area (gross - excluded = net).
  const surface = computeSurfaceAreas(
    req.surface.length,
    req.surface.width,
    req.excludeAreas,
  );

  // 2. Resolve standard + custom overrides.
  const { presetId, params } = resolveTileStandard(req.standard);

  // 3. Tile count.
  const tiles = computeTileCounts(
    req.tile.length,
    req.tile.width,
    surface.netSqm,
    params.wastagePercent,
  );

  // 4. Adhesive — branch on method.
  const adhesive =
    params.adhesiveMethod === "thin-set"
      ? buildThinSetResponse(computeThinSetKg(surface.netSqm, params))
      : buildMortarBedResponse(computeMortarBed(surface.netSqm, params), params);

  // 5. Grout.
  const grout = computeGrout(req.tile.length, req.tile.width, tiles.count, params);

  return {
    input: { surface: { type: req.surface.type } },
    standardUsed: {
      preset: presetId,
      effectiveParameters: buildEffectiveParams(params),
    },
    surface: {
      grossArea: asAreaQuantity(surface.grossSqm, "sqm", 2),
      excludedArea: asAreaQuantity(surface.excludedSqm, "sqm", 2),
      netArea: asAreaQuantity(surface.netSqm, "sqm", 2),
    },
    tile: {
      size: { length: req.tile.length, width: req.tile.width },
      areaPerTile: asAreaQuantity(tiles.areaPerTileSqm, "sqm", 4),
      countBeforeWastage: String(tiles.countBeforeWastage),
      wastagePercent: params.wastagePercent,
      count: String(tiles.count),
    },
    adhesive,
    grout: {
      volume: asVolumeQuantity(grout.volumeCum, "cum", 4),
      estimatedWeight: { value: grout.weightKg.toFixed(2), unit: "kg" },
      note:
        "Estimate based on grout density ~1500 kg/cum. Bag sizes vary — round up when ordering.",
    },
  };
}

// Effective params echo — one shape per adhesive method (discriminated on `adhesiveMethod`).
function buildEffectiveParams(
  params: TileEffectiveParams,
): TileResponse["standardUsed"]["effectiveParameters"] {
  const shared = {
    wastagePercent: params.wastagePercent,
    groutWidth: params.groutWidth,
    groutDepth: params.groutDepth,
    tileThickness: params.tileThickness,
  };
  if (params.adhesiveMethod === "thin-set") {
    return {
      ...shared,
      adhesiveMethod: "thin-set",
      thinsetCoverage: params.thinsetCoverage,
    };
  }
  return {
    ...shared,
    adhesiveMethod: "mortar-bed",
    mortarBedThickness: params.mortarBedThickness,
    mortarRatio: params.mortarRatio,
  };
}

function buildThinSetResponse(kg: number): TileResponse["adhesive"] {
  return { method: "thin-set", quantity: { value: kg.toFixed(2), unit: "kg" } };
}

function buildMortarBedResponse(
  mb: { wetVolumeCum: number; cementBags: number; sandCum: number },
  params: TileEffectiveParams,
): TileResponse["adhesive"] {
  return {
    method: "mortar-bed",
    thickness: params.mortarBedThickness,
    mortarVolume: asVolumeQuantity(mb.wetVolumeCum, "cum", 4),
    cement: { value: mb.cementBags.toFixed(2), unit: "bags" },
    sand: { value: cumToUnit(mb.sandCum, "cft").toFixed(2), unit: "cft" },
    mortarRatio: params.mortarRatio,
  };
}
