// The actual math for the concrete-foundation calculator.
// Pure, unit-normalized. No I/O. Runs on the server via the action.

import type { ConcreteFoundationRequest, ConcreteFoundationResponse } from "./types";
import { lengthToMeters, m3ToFt3, m3ToYd3 } from "./units";

const DENSITY_KG_PER_M3 = 2400; // standard reinforced concrete
const BAG80LB_M3 = 0.017; // ~0.60 ft³ yield per 80 lb premix bag
const BAG60LB_M3 = 0.0127; // ~0.45 ft³ yield per 60 lb premix bag
const TRUCK_YD3 = 7; // standard ready-mix delivery truck

export async function computeConcreteFoundation(req: ConcreteFoundationRequest): Promise<ConcreteFoundationResponse> {
  const wastage = req.wastagePercent ? Number(req.wastagePercent) : 5;

  const lenM = lengthToMeters(req.footing.length);
  const widM = lengthToMeters(req.footing.width);
  const depM = lengthToMeters(req.footing.depth);

  const footingM3 = lenM * widM * depM;

  // Stem wall volume only contributes when enabled. Its cross-section is the
  // wall thickness × height, spanning the full footing length.
  const stemOn = req.stemWall.enabled;
  const thkM = stemOn ? lengthToMeters(req.stemWall.thickness) : 0;
  const hgtM = stemOn ? lengthToMeters(req.stemWall.height) : 0;
  const stemM3 = lenM * thkM * hgtM;

  const rawM3 = footingM3 + stemM3;
  const withWastageM3 = rawM3 * (1 + wastage / 100);

  const vol = (m3: number) => ({
    m3: m3.toFixed(2),
    yd3: m3ToYd3(m3).toFixed(2),
    ft3: m3ToFt3(m3).toFixed(2),
  });

  return {
    input: {
      footing: req.footing,
      stemWall: req.stemWall,
    },
    foundation: {
      footingVolume: vol(footingM3),
      stemWallVolume: vol(stemM3),
    },
    volume: {
      beforeWastage: vol(rawM3),
      withWastage: vol(withWastageM3),
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
    standardUsed: {
      wastagePercent: wastage.toFixed(1),
      densityKgPerM3: String(DENSITY_KG_PER_M3),
      bag80lbM3: BAG80LB_M3.toFixed(4),
      bag60lbM3: BAG60LB_M3.toFixed(4),
      truckYd3: String(TRUCK_YD3),
    },
    disclaimer:
      "Volume uses nominal trench and wall dimensions. Order 5–10% extra to cover over-dig, formwork spill, and a bumpy trench bed. Footing width and depth should follow your structural drawings — this calculator sizes the concrete to order, not the footing design.",
  };
}