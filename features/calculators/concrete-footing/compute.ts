// The actual math for the concrete-footing calculator.
// Pure, unit-normalized. No I/O. Runs on the server via the action.

import type { ConcreteFootingRequest, ConcreteFootingResponse } from "./types";
import { lengthToMeters, m3ToFt3, m3ToYd3 } from "./units";

const DENSITY_KG_PER_M3 = 2400; // standard reinforced concrete
const BAG80LB_M3 = 0.017; // ~0.60 ft³ yield per 80 lb premix bag
const BAG60LB_M3 = 0.0127; // ~0.45 ft³ yield per 60 lb premix bag
const TRUCK_YD3 = 7; // standard ready-mix delivery truck

export async function computeConcreteFooting(req: ConcreteFootingRequest): Promise<ConcreteFootingResponse> {
  const wastage = req.wastagePercent ? Number(req.wastagePercent) : 5;
  const quantity = Number(req.quantity) || 1;

  const lenM = lengthToMeters(req.length);
  const widM = lengthToMeters(req.width);
  const hgtM = lengthToMeters(req.height);
  const diaM = lengthToMeters(req.diameter);

  // One footing in cubic metres. Pier is a cylinder; the others are prisms.
  const unitM3 =
    req.footingType === "pier"
      ? Math.PI * (diaM / 2) ** 2 * hgtM
      : lenM * widM * hgtM;

  const rawM3 = unitM3 * quantity;
  const withWastageM3 = rawM3 * (1 + wastage / 100);

  return {
    input: {
      footingType: req.footingType,
      length: req.length,
      width: req.width,
      height: req.height,
      diameter: req.diameter,
      quantity: quantity.toFixed(0),
    },
    footing: {
      unit: {
        m3: unitM3.toFixed(2),
        ft3: m3ToFt3(unitM3).toFixed(2),
        yd3: m3ToYd3(unitM3).toFixed(2),
      },
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
      "Volume uses nominal footing dimensions and ignores formwork and the compacted-bed overdig. Order 5–10% extra to cover uneven excavation and spill. Premix bag counts assume a yield of 0.6 ft³ per 80 lb bag and 0.45 ft³ per 60 lb bag.",
  };
}