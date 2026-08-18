// The actual math for the concrete-slab calculator.
// Pure, unit-normalized. No I/O. Runs on the server via the action.

import type { ConcreteSlabRequest, ConcreteSlabResponse } from "./types";
import { lengthToMeters, m3ToFt3, m3ToYd3, m2ToFt2 } from "./units";

const DENSITY_KG_PER_M3 = 2400; // standard reinforced concrete
const BAG80LB_M3 = 0.017; // ~0.60 ft³ yield per 80 lb premix bag
const BAG60LB_M3 = 0.0127; // ~0.45 ft³ yield per 60 lb premix bag
const TRUCK_YD3 = 7; // standard ready-mix delivery truck

export async function computeConcreteSlab(req: ConcreteSlabRequest): Promise<ConcreteSlabResponse> {
  const wastage = req.wastagePercent ? Number(req.wastagePercent) : 5;

  const lenM = lengthToMeters(req.length);
  const widM = lengthToMeters(req.width);
  const thkM = lengthToMeters(req.thickness);
  const areaM2 = lenM * widM;
  const rawM3 = areaM2 * thkM;
  const withWastageM3 = rawM3 * (1 + wastage / 100);

  return {
    input: {
      length: req.length,
      width: req.width,
      thickness: req.thickness,
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
    standardUsed: {
      wastagePercent: wastage.toFixed(1),
      densityKgPerM3: String(DENSITY_KG_PER_M3),
      bag80lbM3: BAG80LB_M3.toFixed(4),
      bag60lbM3: BAG60LB_M3.toFixed(4),
      truckYd3: String(TRUCK_YD3),
    },
    disclaimer:
      "Volume uses nominal slab dimensions. Order 5–10% extra to cover formwork spill and an uneven subgrade. Premix bag counts assume a yield of 0.6 ft³ per 80 lb bag and 0.45 ft³ per 60 lb bag.",
  };
}