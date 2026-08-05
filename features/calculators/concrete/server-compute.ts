/**
 * Server-side implementation of the concrete calculator.
 *
 * Canonical implementation — the whole computation runs inside Next.js. The
 * `roadmap/api/**` spec files describe an eventual `POST /api/v1/calculators/
 * concrete` on a separate Java service; we don't run one today because
 * calculators are pure functions and paying for a second service just to host
 * them isn't worth it. When persistence or multi-tenant features arrive, we
 * revisit — this module stays as a fallback / offline path.
 *
 * Wire format matches the future REST response byte-for-byte.
 *
 * Throws bare-string errors (e.g. `UNKNOWN_PRESET:M99`) that the calling
 * Server Action's `normalizeError` maps to the spec's error shape.
 *
 * NOTE for future reconcilers: the API spec's own example (10 cum M20)
 * documents `88.5 bags / 4425 kg / 234.6 cft sand` but those numbers don't
 * reproduce from the spec's stated formula (dry×1.54, split 1:1.5:3, then 3%
 * wastage, then rounded up to whole bags). This module applies the documented
 * formula literally and returns integer bag counts as the spec's text (not
 * the example) instructs. Reconcile which is authoritative if / when a real
 * backend lands.
 */

import "server-only";

import {
  AGGREGATE_BULK_DENSITY_KG_PER_CUM,
  SAND_BULK_DENSITY_KG_PER_CUM,
  computeConcreteQuantities,
} from "./formula";
import { resolveConcreteStandard } from "./standards";
import {
  asMassQuantity,
  asVolumeQuantity,
  volumeToCum,
  volumeToOutput,
} from "./units";
import type {
  AggregateOutputUnit,
  CementOutputUnit,
  ConcreteRequest,
  ConcreteResponse,
  SandOutputUnit,
} from "./types";

export async function computeConcreteOnServer(
  req: ConcreteRequest,
): Promise<ConcreteResponse> {
  const params = resolveConcreteStandard(req.standard); // throws UNKNOWN_PRESET

  const wetVolumeCum = volumeToCum(req.volume);
  const out = computeConcreteQuantities({ params, wetVolumeCum });

  // Chosen output units — spec defaults.
  const cementUnit: CementOutputUnit = req.outputUnits?.cement ?? "bags";
  const sandUnit: SandOutputUnit = req.outputUnits?.sand ?? "cft";
  const aggregateUnit: AggregateOutputUnit =
    req.outputUnits?.aggregate ?? "cft";

  // Cement: bags (integer, rounded up) or kg (2 decimals).
  const cementValueStr =
    cementUnit === "bags" ? String(out.cementBags) : out.cementKg.toFixed(2);

  // Sand + aggregate: apply the chosen output unit, keeping SI as
  // canonical inside `inSI` so consumers who need cum always have it.
  const sandOut = volumeToOutput(
    out.sandCum,
    sandUnit,
    SAND_BULK_DENSITY_KG_PER_CUM,
  );
  const aggregateOut = volumeToOutput(
    out.aggregateCum,
    aggregateUnit,
    AGGREGATE_BULK_DENSITY_KG_PER_CUM,
  );

  const response: ConcreteResponse = {
    input: {
      volume: req.volume,
    },
    standardUsed: {
      preset: req.standard?.preset ?? "M20",
      effectiveParameters: {
        mixRatio: params.mixRatio,
        wastagePercent: params.wastagePercent,
        cementDensity: params.cementDensity,
        cementBagWeight: params.cementBagWeight,
        dryToWetFactor: params.dryToWetFactor,
      },
    },
    quantities: {
      cement: {
        value: cementValueStr,
        unit: cementUnit,
        inSI: asMassQuantity(out.cementKg, 2),
      },
      sand: {
        value: sandOut.value.toFixed(2),
        unit: sandUnit,
        inSI: asVolumeQuantity(out.sandCum, "cum", 2),
      },
      aggregate: {
        value: aggregateOut.value.toFixed(2),
        unit: aggregateUnit,
        inSI: asVolumeQuantity(out.aggregateCum, "cum", 2),
      },
    },
    breakdown: {
      dryVolume: asVolumeQuantity(out.dryVolumeCum, "cum", 2),
      wastageApplied: { value: params.wastagePercent, unit: "%" },
      notes:
        `Quantities include ${params.wastagePercent}% wastage. ` +
        `Cement rounded up to whole bags.`,
    },
  };

  return response;
}
