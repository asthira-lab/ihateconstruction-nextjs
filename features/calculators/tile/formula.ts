// Pure tile math — server-only. No I/O, no framework. All internal math in SI.

import "server-only";

import { areaToSqm, lengthToMeters } from "./units";
import type { ExcludeArea, LengthQuantity } from "./types";
import type { TileEffectiveParams } from "./standards";

// Cement density used to convert mortar-bed sand share to volume; matches concrete calculator.
const CEMENT_BAG_KG = 50;
const CEMENT_DENSITY_KG_PER_CUM = 1440;
const CEMENT_BAG_CUM = CEMENT_BAG_KG / CEMENT_DENSITY_KG_PER_CUM; // ~0.0347 cum
const DRY_WET_FACTOR = 1.33; // dry mortar to wet volume (matches concrete calc)

// Grout density used to estimate weight from volume.
const GROUT_DENSITY_KG_PER_CUM = 1500;

// Surface area result — gross, excluded, net (all in sqm).
export interface SurfaceAreas {
  grossSqm: number;
  excludedSqm: number;
  netSqm: number;
}

// Compute gross/excluded/net surface area. Throws EXCLUSIONS_EXCEED_SURFACE when net ≤ 0.
export function computeSurfaceAreas(
  length: LengthQuantity,
  width: LengthQuantity,
  excludeAreas: ExcludeArea[] | undefined,
): SurfaceAreas {
  const grossSqm = lengthToMeters(length) * lengthToMeters(width);
  const excludedSqm = (excludeAreas ?? []).reduce(
    (acc, ex) => acc + lengthToMeters(ex.length) * lengthToMeters(ex.width),
    0,
  );
  if (excludedSqm >= grossSqm) {
    throw new Error(`EXCLUSIONS_EXCEED_SURFACE:${excludedSqm.toFixed(2)}>=${grossSqm.toFixed(2)}`);
  }
  return { grossSqm, excludedSqm, netSqm: grossSqm - excludedSqm };
}

// Tile-count computation: raw tiles fitted then wastage % applied and rounded up.
export interface TileCounts {
  areaPerTileSqm: number;
  countBeforeWastage: number;
  count: number;
}

export function computeTileCounts(
  tileLength: LengthQuantity,
  tileWidth: LengthQuantity,
  netSqm: number,
  wastagePercent: string,
): TileCounts {
  const areaPerTileSqm = lengthToMeters(tileLength) * lengthToMeters(tileWidth);
  if (areaPerTileSqm <= 0) throw new Error("VALIDATION_FAILED:tile size must be positive");
  const countBeforeWastage = Math.ceil(netSqm / areaPerTileSqm);
  const pct = Number(wastagePercent);
  const count = Math.ceil(countBeforeWastage * (1 + pct / 100));
  return { areaPerTileSqm, countBeforeWastage, count };
}

// Thin-set adhesive quantity (kg) = netSqm / coverage(sqm per kg).
export function computeThinSetKg(netSqm: number, params: TileEffectiveParams): number {
  const coverageSqmPerKg = areaToSqm(params.thinsetCoverage);
  if (coverageSqmPerKg <= 0) {
    throw new Error("VALIDATION_FAILED:thinsetCoverage must be greater than zero");
  }
  return netSqm / coverageSqmPerKg;
}

// Mortar-bed adhesive breakdown: wet volume, cement bags, sand cft.
export interface MortarBedBreakdown {
  wetVolumeCum: number;
  cementBags: number;
  sandCum: number;
}

export function computeMortarBed(
  netSqm: number,
  params: TileEffectiveParams,
): MortarBedBreakdown {
  const thicknessM = lengthToMeters(params.mortarBedThickness);
  const wetVolumeCum = netSqm * thicknessM;
  const dryVolumeCum = wetVolumeCum * DRY_WET_FACTOR;

  const [aStr, bStr] = params.mortarRatio.split(":");
  const a = Number(aStr);
  const b = Number(bStr);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    throw new Error(`VALIDATION_FAILED:invalid mortarRatio ${params.mortarRatio}`);
  }
  const total = a + b;
  const cementCum = (a / total) * dryVolumeCum;
  const sandCum = (b / total) * dryVolumeCum;
  const cementBags = cementCum / CEMENT_BAG_CUM;
  return { wetVolumeCum, cementBags, sandCum };
}

// Grout: volume ≈ joint area × joint depth, joint area from perimeter × count.
export interface GroutBreakdown {
  volumeCum: number;
  weightKg: number;
}

export function computeGrout(
  tileLength: LengthQuantity,
  tileWidth: LengthQuantity,
  tileCount: number,
  params: TileEffectiveParams,
): GroutBreakdown {
  const tileLm = lengthToMeters(tileLength);
  const tileWm = lengthToMeters(tileWidth);
  const groutWm = lengthToMeters(params.groutWidth);
  const groutDm = lengthToMeters(params.groutDepth);

  // Perimeter around each tile × count gives total joint length (each joint
  // is shared between two tiles, so divide by 2 to avoid double-counting).
  const totalJointLengthM = ((tileLm + tileWm) * 2 * tileCount) / 2;
  const volumeCum = totalJointLengthM * groutWm * groutDm;
  const weightKg = volumeCum * GROUT_DENSITY_KG_PER_CUM;
  return { volumeCum, weightKg };
}
