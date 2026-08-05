/**
 * The brick calculation itself — pure math, no I/O, no framework.
 *
 * Marked server-only because the whole point of putting compute on the server
 * is to keep the formula off the client bundle. A stray import from a
 * `"use client"` file will fail at build time here.
 */

import "server-only";

import { lengthToMeters, volumeToCum } from "./units";
import type { LengthQuantity } from "./types";
import type { BrickStandardPreset } from "./standards";

// Standard dry-to-wet factor for mortar volume (accounts for bulking of sand
// and voids in the dry mix). 1.33 is the industry-typical value and is the
// preset default; overridable per-request via `standard.custom.mortarDryToWetFactor`.
//
// NOTE for backend implementers: the API spec's example (10m × 3m × 230mm wall,
// 0.9 × 2.1m door, modular-indian preset) claims 5.7 bags cement + 38.3 cft
// sand, but those numbers correspond to a dry-mortar volume of ~1.28 cum —
// i.e. no 1.33 factor applied. This module applies the factor as the
// spec's prose describes, yielding ~10 bags + ~72 cft for that case. When the
// backend lands, reconcile which interpretation is authoritative.

// Cement bag reference: 1 bag = 50 kg = ~1.226 cft = ~0.0347 cum of loose
// cement. Using 0.0347 cum/bag keeps mortar-to-bags derivation clean.
const CEMENT_BAG_VOLUME_CUM = 0.0347;

// 1 cubic meter = 35.3147 cubic feet.
const CUM_TO_CFT = 35.3146667;

export interface FormulaInputs {
  params: BrickStandardPreset["parameters"];
  /**
   * Total masonry volume to fill with brick + mortar, in cubic meters.
   * For wall mode this is `netArea × thickness`; for volume mode this is
   * the user-provided volume converted to cum.
   */
  masonryVolumeCum: number;
}

export interface FormulaOutputs {
  bricksBeforeWastage: number;
  bricksWithWastage: number;
  mortarVolumeCum: number;
  mortarVolumeCumWithWastage: number;
  cementBags: number;
  sandCft: number;
}

/**
 * Core formula: given masonry volume and the standard parameters, return
 * brick count + mortar quantities. All inputs already converted to SI.
 */
export function computeBrickQuantities({
  params,
  masonryVolumeCum,
}: FormulaInputs): FormulaOutputs {
  // 1. Nominal brick (brick + mortar joint on two sides): the space a single
  //    brick occupies when laid. Brick length + one joint × brick width + one
  //    joint × brick height + one joint. This is what "1 brick's worth" of
  //    wall actually consumes.
  const brickLenM = lengthToMeters(params.brickSize.length);
  const brickWidM = lengthToMeters(params.brickSize.width);
  const brickHgtM = lengthToMeters(params.brickSize.height);
  const jointM = lengthToMeters(params.mortarThickness);

  const nominalBrickVolume =
    (brickLenM + jointM) * (brickWidM + jointM) * (brickHgtM + jointM);
  const actualBrickVolume = brickLenM * brickWidM * brickHgtM;

  // 2. Brick count: total masonry volume ÷ nominal brick volume, rounded up.
  const bricksBeforeWastage = Math.ceil(masonryVolumeCum / nominalBrickVolume);
  const wastagePct = Number(params.wastagePercent);
  const bricksWithWastage = Math.ceil(
    bricksBeforeWastage * (1 + wastagePct / 100),
  );

  // 3. Mortar volume: total volume minus what the bricks themselves occupy.
  //    Uses `bricksBeforeWastage` because wastage bricks don't consume mortar.
  const mortarVolumeCum = Math.max(
    0,
    masonryVolumeCum - bricksBeforeWastage * actualBrickVolume,
  );

  // 4. Mortar with wastage — this is the "wet" mortar we need to mix.
  const mortarWastagePct = Number(params.mortarWastagePercent);
  const wetMortarCum = mortarVolumeCum * (1 + mortarWastagePct / 100);

  // 5. Dry mortar volume (cement + sand needed to produce that wet volume).
  const dryToWetFactor = Number(params.mortarDryToWetFactor);
  const dryMortarCum = wetMortarCum * dryToWetFactor;

  // 6. Cement + sand split by mortar ratio "a:b" (cement:sand).
  const [cementPartsStr = "1", sandPartsStr = "6"] = params.mortarRatio.split(":");
  const cementParts = Number(cementPartsStr);
  const sandParts = Number(sandPartsStr);
  const totalParts = cementParts + sandParts;

  const cementCum = (dryMortarCum * cementParts) / totalParts;
  const sandCum = (dryMortarCum * sandParts) / totalParts;

  // Cement bags: round up to the nearest half bag for small jobs (< 5 bags),
  // whole bag otherwise — matches how contractors actually order.
  const cementBagsRaw = cementCum / CEMENT_BAG_VOLUME_CUM;
  const cementBags =
    cementBagsRaw < 5
      ? Math.ceil(cementBagsRaw * 2) / 2 // nearest half
      : Math.ceil(cementBagsRaw); // whole bag

  // Sand traditionally quoted in cft in Indian construction.
  const sandCft = sandCum * CUM_TO_CFT;

  return {
    bricksBeforeWastage,
    bricksWithWastage,
    mortarVolumeCum: wetMortarCum,
    mortarVolumeCumWithWastage: wetMortarCum,
    cementBags,
    sandCft,
  };
}

/** Convenience for wall mode: sum opening areas (subtracted from gross). */
export function openingsAreaSqm(
  openings: { width: LengthQuantity; height: LengthQuantity }[] | undefined,
): number {
  if (!openings) return 0;
  return openings.reduce(
    (acc, o) => acc + lengthToMeters(o.width) * lengthToMeters(o.height),
    0,
  );
}

export {
  volumeToCum, // re-export so callers don't need to know both modules
};
