/**
 * Concrete quantity math — pure, no I/O, no framework.
 *
 * Marked server-only because the point of doing compute on the server is to
 * keep the formula off the client bundle. An accidental import from a
 * `"use client"` file will fail at build time here.
 *
 * All internal math runs in SI (cum for volume, kg for mass). Output-unit
 * conversion happens in units.ts on the way out.
 */

import "server-only";

import { massToKg } from "./units";
import type { ConcreteStandardPreset } from "./standards";

// 1 cubic meter = 35.3147 cubic feet. Kept here for the sand-in-cft path.
const CUM_TO_CFT = 35.3146667;

// Bulk densities used only when the user asks for sand/aggregate in kg.
// Values are conservative Indian-site averages; if we later expose these
// as customizable keys, this table becomes fallback defaults.
const SAND_BULK_DENSITY_KG_PER_CUM = 1600;
const AGGREGATE_BULK_DENSITY_KG_PER_CUM = 1500;

export interface ConcreteFormulaInputs {
  params: ConcreteStandardPreset["parameters"];
  /** Total wet volume of finished concrete, in cubic meters. */
  wetVolumeCum: number;
}

export interface ConcreteFormulaOutputs {
  dryVolumeCum: number;

  cementKg: number;
  /** Rounded up to whole bags — contractors buy bags, not fractions. */
  cementBags: number;

  sandCum: number;
  aggregateCum: number;

  // Effective ratio parts kept around for the response's parameter echo.
  mixParts: { cement: number; sand: number; aggregate: number };
}

/**
 * Core calculation. Takes wet volume + resolved parameters; returns raw SI
 * quantities plus the derived cement-bag count.
 *
 * Steps (as documented in the spec's `breakdown.notes`):
 *   1. Dry volume  = wet volume × dryToWetFactor       (default 1.54)
 *   2. Add wastage = dry volume × (1 + wastage/100)   (uniform across all)
 *   3. Split by mix ratio a:b:c into cement/sand/aggregate volumes
 *   4. Cement volume × cement density → kg → bags (round up)
 */
export function computeConcreteQuantities({
  params,
  wetVolumeCum,
}: ConcreteFormulaInputs): ConcreteFormulaOutputs {
  const parts = params.mixRatio.split(":");
  const cementParts = Number(parts[0]);
  const sandParts = Number(parts[1]);
  const aggregateParts = Number(parts[2]);
  const totalParts = cementParts + sandParts + aggregateParts;

  const dryToWet = Number(params.dryToWetFactor);
  const wastagePct = Number(params.wastagePercent);

  // 1. Base dry volume required to produce the wet volume.
  const baseDryVolumeCum = wetVolumeCum * dryToWet;

  // 2. Wastage applied uniformly to all three components.
  const dryVolumeCum = baseDryVolumeCum * (1 + wastagePct / 100);

  // 3. Split by ratio.
  const cementVolumeCum = (dryVolumeCum * cementParts) / totalParts;
  const sandCum = (dryVolumeCum * sandParts) / totalParts;
  const aggregateCum = (dryVolumeCum * aggregateParts) / totalParts;

  // 4. Cement mass and bag count. Density is kg/cum; bag weight is kg.
  const densityKgPerCum = massToKg(params.cementDensity);
  const bagWeightKg = massToKg(params.cementBagWeight);

  const cementKg = cementVolumeCum * densityKgPerCum;
  // Contractors buy whole bags — always round up.
  const cementBags = Math.ceil(cementKg / bagWeightKg);

  return {
    dryVolumeCum,
    cementKg,
    cementBags,
    sandCum,
    aggregateCum,
    mixParts: {
      cement: cementParts,
      sand: sandParts,
      aggregate: aggregateParts,
    },
  };
}

// Re-exports for callers that only need the formula module.
export {
  CUM_TO_CFT,
  SAND_BULK_DENSITY_KG_PER_CUM,
  AGGREGATE_BULK_DENSITY_KG_PER_CUM,
};
