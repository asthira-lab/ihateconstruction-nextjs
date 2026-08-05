// Server-side steel implementation.

import "server-only";

import { applyWastage, computeBarWeight } from "./formula";
import {
  resolveSteelStandard,
  resolveThumbRuleStandard,
} from "./standards";
import { asLengthMeters, asMassQuantity, volumeToCum } from "./units";
import type { SteelRequest, SteelResponse } from "./types";

export async function computeSteelOnServer(
  req: SteelRequest,
): Promise<SteelResponse> {
  if (req.mode === "barSchedule") {
    const std = resolveSteelStandard(req.standard);

    let sumKg = 0;
    const bars: NonNullable<SteelResponse["bars"]> = req.bars.map((bar) => {
      const w = computeBarWeight(bar, std.weightPerMetreFormula);
      sumKg += w.weightKg;
      return {
        label: bar.label,
        diameter: bar.diameter,
        length: bar.length,
        count: bar.count,
        weightPerMetre: asMassQuantity(w.weightPerMetreKg, 3),
        totalLength: asLengthMeters(w.totalLengthM, 2),
        weight: asMassQuantity(w.weightKg, 2),
      };
    });

    const totals = applyWastage(sumKg, std.wastagePercent);

    return {
      input: { mode: "barSchedule" },
      standardUsed: {
        preset: std.presetId,
        effectiveParameters: {
          steelDensity: std.steelDensity,
          wastagePercent: std.wastagePercent,
          weightPerMetreFormula: std.weightPerMetreFormula,
        },
      },
      bars,
      totals: {
        weightBeforeWastage: asMassQuantity(totals.weightBeforeWastageKg, 2),
        wastage: asMassQuantity(totals.wastageKg, 2),
        totalWeight: asMassQuantity(totals.totalWeightKg, 2),
      },
    };
  }

  // thumbRule mode
  const { kgPerCum, wastagePercent } = resolveThumbRuleStandard(
    req.member,
    req.standard,
  );
  const volumeCum = volumeToCum(req.concreteVolume);
  const weightBeforeKg = volumeCum * Number(kgPerCum);
  const totals = applyWastage(weightBeforeKg, wastagePercent);

  return {
    input: { mode: "thumbRule", member: req.member },
    standardUsed: {
      // Thumb rule doesn't need a bar-formula preset; omit `preset` unless explicitly given.
      ...(req.standard?.preset ? { preset: req.standard.preset } : {}),
      effectiveParameters: {
        thumbRuleKgPerCum: kgPerCum,
        wastagePercent,
      },
    },
    totals: {
      weightBeforeWastage: asMassQuantity(totals.weightBeforeWastageKg, 2),
      wastage: asMassQuantity(totals.wastageKg, 2),
      totalWeight: asMassQuantity(totals.totalWeightKg, 2),
    },
    disclaimer:
      "Thumb-rule estimates are ±20% typical. Use a bar schedule for procurement.",
  };
}
