// Server-side rebar implementation.

import "server-only";

import { applyWastage, computeRebarGrid, rebarPieces, weightPerMetreKg } from "./formula";
import { resolveWastage } from "./standards";
import { asKg, asMeters, lengthToMeters, metersToSqft } from "./units";
import type { RebarRequest, RebarResponse } from "./types";

export async function computeRebarOnServer(req: RebarRequest): Promise<RebarResponse> {
  const lengthM = lengthToMeters(req.length);
  const widthM = lengthToMeters(req.width);
  const spacingM = lengthToMeters(req.spacing);
  const edgeM = lengthToMeters(req.edgeSpacing);
  const barLengthM = lengthToMeters(req.barLength);
  const diameterMm = Number(req.barDiameter.value);
  const wastagePercent = resolveWastage(req.wastagePercent ? { wastagePercent: req.wastagePercent } : undefined);

  const grid = computeRebarGrid(lengthM, widthM, spacingM, edgeM);

  const weightPerMetre = weightPerMetreKg(diameterMm);
  const max = Math.max(grid.longitudinalCount, grid.transverseCount);
  if (max < 1) {
    throw new Error("UNKNOWN_CUSTOM_KEY:grid");
  }

  const weightBeforeKg = grid.totalLengthM * weightPerMetre;
  const totals = applyWastage(weightBeforeKg, wastagePercent);

  const areaSqm = lengthM * widthM;
  const areaSqft = metersToSqft(areaSqm);
  const perSqm = areaSqm > 0 ? totals.totalWeightKg / areaSqm : 0;
  const perSqft = areaSqft > 0 ? totals.totalWeightKg / areaSqft : 0;

  return {
    input: {
      member: req.member,
      length: req.length,
      width: req.width,
      spacing: req.spacing,
      edgeSpacing: req.edgeSpacing,
    },
    barDiameter: req.barDiameter,
    grid: {
      gridLength: asMeters(grid.gridLengthM),
      gridWidth: asMeters(grid.gridWidthM),
    },
    longitudinal: {
      count: grid.longitudinalCount,
      barLength: asMeters(grid.gridLengthM),
    },
    transverse: {
      count: grid.transverseCount,
      barLength: asMeters(grid.gridWidthM),
    },
    totalLength: asMeters(grid.totalLengthM),
    pieces: rebarPieces(grid.totalLengthM, barLengthM) || 0,
    area: {
      value: areaSqm.toFixed(2),
      perSqm: asKg(perSqm, 2),
      perSqft: asKg(perSqft, 2),
    },
    totals: {
      weightBeforeWastage: asKg(totals.weightBeforeKg, 2),
      wastage: asKg(totals.wastageKg, 2),
      totalWeight: asKg(totals.totalWeightKg, 2),
    },
    standardUsed: { wastagePercent },
    disclaimer:
      "Estimate only. Rebar layouts, laps, hooks, chairs, and splice lengths vary by design; always verify with your structural drawings and codes.",
  };
}
