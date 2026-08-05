/**
 * The paint calculation itself — pure math, no I/O, no framework.
 *
 * Server-only: the point of doing compute on the server is to keep the
 * formulas off the client bundle. A stray import from a `"use client"` file
 * will fail at build time here.
 *
 * All internal math runs in SI (sqm for area, litres for volume). The
 * response-shaping code in server-compute.ts converts to whatever the
 * request asked for on the way out.
 */

import "server-only";

import { areaToSqm, lengthToMeters } from "./units";
import type { AreaQuantity, LengthQuantity, PaintLayer } from "./types";

// --- surface geometry ----------------------------------------------------

export interface RoomInputs {
  length: LengthQuantity;
  width: LengthQuantity;
  height: LengthQuantity;
  includeCeiling: boolean;
}

export interface SurfaceAreas {
  wallGrossSqm: number;
  ceilingSqm: number;
  openingsSqm: number;
  netSqm: number;
}

/**
 * Compute wall + ceiling area for a rectangular room, subtracting openings.
 *
 *   wallGross = 2 × (length + width) × height  (four walls, perimeter × height)
 *   ceiling   = length × width, if includeCeiling
 *   openings  = Σ(width × height) for each door / window
 *   net       = wallGross + ceiling − openings
 *
 * Throws `OPENINGS_EXCEED_WALL:<openings>>=<wallGross>` if the caller has
 * doors + windows summing to more than the walls themselves — that's
 * physically impossible and usually a units mistake.
 */
export function computeSurfaceAreas(
  room: RoomInputs,
  openings: { width: LengthQuantity; height: LengthQuantity }[] | undefined,
): SurfaceAreas {
  const lengthM = lengthToMeters(room.length);
  const widthM = lengthToMeters(room.width);
  const heightM = lengthToMeters(room.height);

  const wallGrossSqm = 2 * (lengthM + widthM) * heightM;
  const ceilingSqm = room.includeCeiling ? lengthM * widthM : 0;
  const openingsSqm = openingsAreaSqm(openings);

  // Sanity check against the walls only — a large skylight opening in the
  // ceiling is uncommon enough that we treat "openings" as wall openings.
  if (openingsSqm >= wallGrossSqm) {
    throw new Error(
      `OPENINGS_EXCEED_WALL:${openingsSqm.toFixed(2)}>=${wallGrossSqm.toFixed(2)}`,
    );
  }

  const netSqm = wallGrossSqm + ceilingSqm - openingsSqm;

  return { wallGrossSqm, ceilingSqm, openingsSqm, netSqm };
}

/** Sum the areas of each opening (doors, windows). */
export function openingsAreaSqm(
  openings: { width: LengthQuantity; height: LengthQuantity }[] | undefined,
): number {
  if (!openings) return 0;
  return openings.reduce(
    (acc, o) => acc + lengthToMeters(o.width) * lengthToMeters(o.height),
    0,
  );
}

// --- per-layer litres ---------------------------------------------------

export interface PaintLayerFormulaInputs {
  layer: PaintLayer;
  params: {
    coveragePerLitre: AreaQuantity;
    wastagePercent: string;
  };
  /** Net paintable area, in square meters. Same for every layer on this surface. */
  netSqm: number;
}

export interface PaintLayerFormulaOutputs {
  areaCoveredSqm: number;
  litresBeforeWastage: number;
  litres: number;
}

/**
 * How much paint one primer / finish / sealer layer needs.
 *
 *   areaCovered      = netSqm × coats                (n coats = n paintings)
 *   coveragePerLitre = params.coveragePerLitre       (in sqm/L)
 *   before wastage   = areaCovered / coveragePerLitre
 *   litres           = before wastage × (1 + wastage/100)
 */
export function computeLayerLitres({
  layer,
  params,
  netSqm,
}: PaintLayerFormulaInputs): PaintLayerFormulaOutputs {
  const coveragePerLitreSqm = areaToSqm(params.coveragePerLitre);
  if (coveragePerLitreSqm <= 0) {
    // A preset shouldn't ship this, but a `custom.coveragePerLitre` from a
    // malformed request could. Guard so we never divide by zero.
    throw new Error(`VALIDATION_FAILED:coveragePerLitre must be greater than zero`);
  }

  const areaCoveredSqm = netSqm * layer.coats;
  const litresBeforeWastage = areaCoveredSqm / coveragePerLitreSqm;

  const wastagePct = Number(params.wastagePercent);
  const litres = litresBeforeWastage * (1 + wastagePct / 100);

  return { areaCoveredSqm, litresBeforeWastage, litres };
}

// --- per-layer kilograms (putty) ----------------------------------------

export interface PuttyLayerFormulaInputs {
  layer: PaintLayer;
  params: {
    kgPerSqm: string;
    wastagePercent: string;
  };
  netSqm: number;
}

export interface PuttyLayerFormulaOutputs {
  areaCoveredSqm: number;
  kgBeforeWastage: number;
  kg: number;
}

/**
 * How many kilograms one putty layer needs.
 *
 *   areaCovered      = netSqm × coats
 *   kgPerSqm         = params.kgPerSqm (kg of dry putty per square metre per coat)
 *   before wastage   = areaCovered × kgPerSqm
 *   kg               = before wastage × (1 + wastage/100)
 */
export function computeLayerPuttyKg({
  layer,
  params,
  netSqm,
}: PuttyLayerFormulaInputs): PuttyLayerFormulaOutputs {
  const kgPerSqm = Number(params.kgPerSqm);
  if (!Number.isFinite(kgPerSqm) || kgPerSqm <= 0) {
    throw new Error(`VALIDATION_FAILED:kgPerSqm must be greater than zero`);
  }

  const areaCoveredSqm = netSqm * layer.coats;
  const kgBeforeWastage = areaCoveredSqm * kgPerSqm;

  const wastagePct = Number(params.wastagePercent);
  const kg = kgBeforeWastage * (1 + wastagePct / 100);

  return { areaCoveredSqm, kgBeforeWastage, kg };
}
