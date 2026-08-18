// The actual math for the concrete-staircase calculator.
// Pure, unit-normalized. No I/O. Runs on the server via the action.

import type { ConcreteStaircaseRequest, ConcreteStaircaseResponse } from "./types";
import { lengthToMeters } from "./units";

// Standard concrete mix ratio 1:2:4 (cement:sand:aggregate) by volume
const MIX_RATIO = { cement: 1, sand: 2, aggregate: 4 };
const TOTAL_PARTS = MIX_RATIO.cement + MIX_RATIO.sand + MIX_RATIO.aggregate;

// Material densities (kg/m³)
const CEMENT_DENSITY = 1440; // kg/m³
const SAND_DENSITY = 1600; // kg/m³
const AGGREGATE_DENSITY = 1600; // kg/m³

// Bag weights
const BAG_25KG = 25;
const BAG_50KG = 50;

export async function computeConcreteStaircase(req: ConcreteStaircaseRequest): Promise<ConcreteStaircaseResponse> {
  const riseM = lengthToMeters(req.rise);
  const runM = lengthToMeters(req.run);
  const widthM = lengthToMeters(req.width);
  const stepCount = req.stepCount;
  const wastage = req.wastagePercent ? Number(req.wastagePercent) : 5;

  // Volume of one step = rise * run * width (triangular prism approximation)
  // Actually, concrete stairs are typically rectangular prism steps
  // Volume = sum of each step volume = rise * run * width * stepCount
  const stepVolumeM3 = riseM * runM * widthM;
  const totalVolumeM3 = stepVolumeM3 * stepCount;

  // Add wastage
  const volumeWithWastage = totalVolumeM3 * (1 + wastage / 100);

  // Calculate material quantities for 1:2:4 mix
  const cementVolume = (volumeWithWastage / TOTAL_PARTS) * MIX_RATIO.cement;
  const sandVolume = (volumeWithWastage / TOTAL_PARTS) * MIX_RATIO.sand;
  const aggregateVolume = (volumeWithWastage / TOTAL_PARTS) * MIX_RATIO.aggregate;

  // Convert to weights
  const cementWeightKg = cementVolume * CEMENT_DENSITY;

  // Calculate bag counts
  const cementBags25kg = Math.ceil(cementWeightKg / BAG_25KG);
  const cementBags50kg = Math.ceil(cementWeightKg / BAG_50KG);

  return {
    input: {
      rise: req.rise,
      run: req.run,
      width: req.width,
      stepCount,
    },
    volume: { value: totalVolumeM3.toFixed(3), unit: "m³" },
    totals: {
      concreteVolume: { value: volumeWithWastage.toFixed(3), unit: "m³" },
      cementBags25kg: { value: cementBags25kg.toString(), unit: "bags" },
      cementBags50kg: { value: cementBags50kg.toString(), unit: "bags" },
      sandVolume: { value: sandVolume.toFixed(3), unit: "m³" },
      aggregateVolume: { value: aggregateVolume.toFixed(3), unit: "m³" },
    },
    standardUsed: {
      wastagePercent: wastage.toFixed(1),
      mixRatio: "1:2:4 (cement:sand:aggregate)",
      cementDensity: `${CEMENT_DENSITY} kg/m³`,
      sandDensity: `${SAND_DENSITY} kg/m³`,
      aggregateDensity: `${AGGREGATE_DENSITY} kg/m³`,
    },
    disclaimer: "Calculations assume rectangular prism steps with standard 1:2:4 mix. Actual volumes may vary based on stair design (e.g., stringers, landings). Consult a structural engineer for load-bearing requirements.",
  };
}