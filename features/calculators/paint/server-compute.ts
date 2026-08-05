/**
 * Server-side implementation of the paint calculator.
 *
 * Canonical implementation — the whole calculation runs inside Next.js. The
 * `roadmap/api/**` spec files describe an eventual REST backend for the same
 * shape; we haven't built it because calculators are pure functions and a
 * second service isn't worth its cost today. When persistence or multi-tenant
 * features arrive, we revisit — this module stays as the fallback path.
 *
 * Wire format matches the future `POST /api/v1/calculators/paint` response
 * byte-for-byte.
 *
 * Throws bare-string errors (e.g. `OPENINGS_EXCEED_WALL:…`,
 * `UNKNOWN_PRESET:<id>`, `UNKNOWN_LAYER_TYPE:<type>`) that the calling Server
 * Action's `normalizeCalcError` maps to the wire error shape.
 */

import "server-only";

import {
  computeLayerLitres,
  computeLayerPuttyKg,
  computeSurfaceAreas,
  type RoomInputs,
} from "./formula";
import { resolvePaintStandard } from "./standards";
import {
  areaToSqm,
  asAreaQuantity,
  asPaintMassQuantity,
  asPaintVolumeQuantity,
} from "./units";
import type { PaintRequest, PaintResponse } from "./types";

export async function computePaintOnServer(
  req: PaintRequest,
): Promise<PaintResponse> {
  // 1. Resolve the surface area. Two modes; either produces a single netSqm.
  let netSqm: number;
  let surface: PaintResponse["surface"] | undefined;

  if (req.mode === "room") {
    const roomInputs: RoomInputs = {
      length: req.room.length,
      width: req.room.width,
      height: req.room.height,
      includeCeiling: req.room.includeCeiling ?? false,
    };
    const s = computeSurfaceAreas(roomInputs, req.openings);
    netSqm = s.netSqm;

    surface = {
      wallGrossArea: asAreaQuantity(s.wallGrossSqm, "sqm", 2),
      ceilingArea: asAreaQuantity(s.ceilingSqm, "sqm", 2),
      openingsArea: asAreaQuantity(s.openingsSqm, "sqm", 2),
      netArea: asAreaQuantity(s.netSqm, "sqm", 2),
    };
  } else {
    netSqm = areaToSqm(req.area);
  }

  // 2. Resolve every layer's standard + compute output. Each layer is
  //    independent; putty layers emit kilograms, paint layers emit litres.
  let totalLitres = 0;
  let totalPuttyKg = 0;
  const layers: PaintResponse["layers"] = req.layers.map((layer) => {
    const preset = resolvePaintStandard(layer.standard); // throws UNKNOWN_PRESET

    // Contract check: a putty layer must be paired with a putty-kind preset.
    // Mismatches (e.g. `type: "putty"` + `preset: "interior-emulsion"`) are
    // user error — surface as UNKNOWN_PRESET so the form's error handler shows it.
    if (layer.type === "putty" && preset.kind !== "putty") {
      throw new Error(`UNKNOWN_PRESET:${preset.id} is not a putty preset`);
    }
    if (layer.type !== "putty" && preset.kind !== "paint") {
      throw new Error(`UNKNOWN_PRESET:${preset.id} is not a paint preset`);
    }

    if (preset.kind === "putty") {
      const out = computeLayerPuttyKg({
        layer,
        params: preset.parameters,
        netSqm,
      });
      totalPuttyKg += out.kg;
      return {
        type: "putty" as const,
        coats: layer.coats,
        standardUsed: {
          preset: preset.id,
          effectiveParameters: {
            kgPerSqm: preset.parameters.kgPerSqm,
            wastagePercent: preset.parameters.wastagePercent,
          },
        },
        areaCovered: asAreaQuantity(out.areaCoveredSqm, "sqm", 2),
        kgBeforeWastage: asPaintMassQuantity(out.kgBeforeWastage, "kg", 2),
        kg: asPaintMassQuantity(out.kg, "kg", 2),
      };
    }

    const out = computeLayerLitres({
      layer,
      params: preset.parameters,
      netSqm,
    });
    totalLitres += out.litres;

    return {
      type: layer.type as "primer" | "finish" | "sealer",
      coats: layer.coats,
      standardUsed: {
        preset: preset.id,
        effectiveParameters: {
          coveragePerLitre: preset.parameters.coveragePerLitre,
          wastagePercent: preset.parameters.wastagePercent,
        },
      },
      areaCovered: asAreaQuantity(out.areaCoveredSqm, "sqm", 2),
      litresBeforeWastage: asPaintVolumeQuantity(out.litresBeforeWastage, "litre", 2),
      litres: asPaintVolumeQuantity(out.litres, "litre", 2),
    };
  });

  const response: PaintResponse = {
    input: { mode: req.mode },
    layers,
    totals: {
      totalLitres: asPaintVolumeQuantity(totalLitres, "litre", 2),
      totalPuttyKg: asPaintMassQuantity(totalPuttyKg, "kg", 2),
    },
    ...(surface ? { surface } : {}),
  };

  return response;
}
