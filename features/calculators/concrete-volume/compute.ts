// The actual math for the concrete-volume calculator.
// Pure, unit-normalized. No I/O. Runs on the server via the action.

import type { ConcreteVolumeRequest, ConcreteVolumeResponse } from "./types";
import { lengthToMeters } from "./units";

const M3_PER_FT3 = 0.0283168466;
const M3_PER_YD3 = 0.764554858;
const DENSITY_KG_PER_M3 = 2400; // standard reinforced concrete

export async function computeConcreteVolume(req: ConcreteVolumeRequest): Promise<ConcreteVolumeResponse> {
  const wastage = Number(req.wastagePercent) || 0;

  const rawM3 =
    req.shape === "rect"
      ? lengthToMeters(req.length) * lengthToMeters(req.width) * lengthToMeters(req.thickness)
      : Math.PI * (lengthToMeters(req.diameter) / 2) ** 2 * lengthToMeters(req.thickness);

  const withWastageM3 = rawM3 * (1 + wastage / 100);

  return {
    input: {
      shape: req.shape,
      length: req.length,
      width: req.width,
      thickness: req.thickness,
      diameter: req.diameter,
    },
    volume: {
      beforeWastage: {
        m3: rawM3.toFixed(2),
        ft3: (rawM3 / M3_PER_FT3).toFixed(2),
        yd3: (rawM3 / M3_PER_YD3).toFixed(2),
      },
      withWastage: {
        m3: withWastageM3.toFixed(2),
        ft3: (withWastageM3 / M3_PER_FT3).toFixed(2),
        yd3: (withWastageM3 / M3_PER_YD3).toFixed(2),
      },
    },
    weight: {
      kg: (withWastageM3 * DENSITY_KG_PER_M3).toFixed(0),
      tonnes: ((withWastageM3 * DENSITY_KG_PER_M3) / 1000).toFixed(2),
    },
    standardUsed: {
      wastagePercent: wastage.toFixed(1),
      densityKgPerM3: String(DENSITY_KG_PER_M3),
    },
    disclaimer:
      "Volume uses nominal dimensions. Order 5–10% extra for uneven ground, over-dig, or formwork spill.",
  };
}