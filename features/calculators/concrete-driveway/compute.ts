// The actual math for the concrete-driveway calculator.
// Pure, unit-normalized. No I/O. Runs on the server via the action.

import type { ConcreteDrivewayRequest, ConcreteDrivewayResponse } from "./types";
import { lengthToMeters, m3ToFt3, m3ToYd3, m2ToFt2 } from "./units";

const DENSITY_KG_PER_M3 = 2400; // standard reinforced concrete
const BAG80LB_M3 = 0.017; // ~0.60 ft³ yield per 80 lb premix bag
const BAG60LB_M3 = 0.0127; // ~0.45 ft³ yield per 60 lb premix bag
const TRUCK_YD3 = 7; // standard ready-mix delivery truck
const WIRE_MESH_SHEET_M2 = 6; // standard 2.4m x 2.5m = 6 m² sheet
const REBAR_DENSITY_KG_PER_M: Record<string, number> = {
  "10mm": 0.617,
  "12mm": 0.888,
  "16mm": 1.579,
  "20mm": 2.466,
};

export async function computeConcreteDriveway(req: ConcreteDrivewayRequest): Promise<ConcreteDrivewayResponse> {
  const wastage = req.wastagePercent ? Number(req.wastagePercent) : 5;

  const lenM = lengthToMeters(req.length);
  const widM = lengthToMeters(req.width);
  const thkM = lengthToMeters(req.thickness);
  const areaM2 = lenM * widM;
  const rawM3 = areaM2 * thkM;
  const withWastageM3 = rawM3 * (1 + wastage / 100);

  // Wire mesh calculation
  let wireMeshSheets: number | undefined;
  if (req.reinforcement === "wire-mesh") {
    wireMeshSheets = Math.ceil(areaM2 / WIRE_MESH_SHEET_M2);
  }

  // Rebar calculation
  let rebar: ConcreteDrivewayResponse["reinforcement"]["rebar"] = undefined;
  if (req.reinforcement === "rebar" && req.rebarSpacing && req.rebarSize) {
    const spacingM = lengthToMeters(req.rebarSpacing);
    const rebarSize = req.rebarSize;
    const densityKgPerM = REBAR_DENSITY_KG_PER_M[rebarSize] ?? 0.888;

    // Calculate rebar grid - both directions
    const barsLongitudinal = Math.ceil(lenM / spacingM) + 1;
    const barsTransverse = Math.ceil(widM / spacingM) + 1;
    const totalLengthM = barsLongitudinal * widM + barsTransverse * lenM;
    const pieces12m = Math.ceil(totalLengthM / 12);
    const weightKg = totalLengthM * densityKgPerM;

    rebar = {
      totalLengthM: totalLengthM.toFixed(2),
      pieces: pieces12m,
      weightKg: weightKg.toFixed(1),
    };
  }

  // Control joint calculation
  let joints: ConcreteDrivewayResponse["joints"] = undefined;
  if (req.jointSpacing) {
    const spacingM = lengthToMeters(req.jointSpacing);
    // Joints in both directions (longitudinal + transverse)
    const jointsLongitudinal = Math.max(0, Math.ceil(lenM / spacingM) - 1);
    const jointsTransverse = Math.max(0, Math.ceil(widM / spacingM) - 1);
    const totalJoints = jointsLongitudinal + jointsTransverse;

    joints = {
      spacingM: spacingM.toFixed(2),
      totalJoints,
    };
  }

  return {
    input: {
      length: req.length,
      width: req.width,
      thickness: req.thickness,
      reinforcement: req.reinforcement,
      rebarSpacing: req.rebarSpacing,
      rebarSize: req.rebarSize,
      jointSpacing: req.jointSpacing,
    },
    slab: {
      area: { m2: areaM2.toFixed(2), ft2: m2ToFt2(areaM2).toFixed(2) },
    },
    volume: {
      beforeWastage: {
        m3: rawM3.toFixed(2),
        yd3: m3ToYd3(rawM3).toFixed(2),
        ft3: m3ToFt3(rawM3).toFixed(2),
      },
      withWastage: {
        m3: withWastageM3.toFixed(2),
        yd3: m3ToYd3(withWastageM3).toFixed(2),
        ft3: m3ToFt3(withWastageM3).toFixed(2),
      },
    },
    weight: {
      kg: (withWastageM3 * DENSITY_KG_PER_M3).toFixed(0),
      tonnes: ((withWastageM3 * DENSITY_KG_PER_M3) / 1000).toFixed(2),
    },
    bags: {
      bag80lb: Math.ceil(withWastageM3 / BAG80LB_M3),
      bag60lb: Math.ceil(withWastageM3 / BAG60LB_M3),
    },
    trucks: {
      value: (m3ToYd3(withWastageM3) / TRUCK_YD3).toFixed(1),
      unit: "7 yd³ trucks",
    },
    reinforcement: {
      type: req.reinforcement ?? "none",
      wireMeshSheets,
      rebar,
    },
    joints,
    standardUsed: {
      wastagePercent: wastage.toFixed(1),
      densityKgPerM3: String(DENSITY_KG_PER_M3),
      bag80lbM3: BAG80LB_M3.toFixed(4),
      bag60lbM3: BAG60LB_M3.toFixed(4),
      truckYd3: String(TRUCK_YD3),
      rebarDensityKgPerM: req.rebarSize ? String(REBAR_DENSITY_KG_PER_M[req.rebarSize] ?? 0.888) : undefined,
    },
    disclaimer:
      "Volume uses nominal driveway dimensions. Order 5–10% extra to cover formwork spill and an uneven subgrade. Premix bag counts assume a yield of 0.6 ft³ per 80 lb bag and 0.45 ft³ per 60 lb bag. Reinforcement quantities are estimates; confirm with structural engineer for load-bearing requirements.",
  };
}