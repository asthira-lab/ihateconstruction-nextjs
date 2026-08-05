/**
 * Server-side implementation of the brick calculator.
 *
 * This is the canonical implementation — not a stand-in. The whole calculation
 * runs inside the Next.js server (a Server Action calls into `compute.ts`,
 * which calls this file). There is no external HTTP backend today: the
 * `roadmap/api/**` spec files document what a future Java service would look
 * like, but the frontend is intentionally self-contained so we don't pay for
 * a second service until there's a feature that needs one (persistence,
 * shared state, multi-tenant auth).
 *
 * Wire format matches the eventual `POST /api/v1/calculators/brick` response
 * byte-for-byte, so when a real backend does arrive we swap the caller in
 * `compute.ts` and this file becomes a fallback / offline path.
 *
 * Throws bare-string errors (e.g. `OPENINGS_EXCEED_WALL:1.9>=2.0`) that the
 * calling Server Action's `normalizeError` maps to the spec's error shape.
 */

import "server-only";

import { computeBrickQuantities, openingsAreaSqm } from "./formula";
import { resolveStandard } from "./standards";
import { asVolumeQuantity, lengthToMeters, volumeToCum } from "./units";
import type { BrickRequest, BrickResponse } from "./types";

export async function computeBrickOnServer(req: BrickRequest): Promise<BrickResponse> {
  const params = resolveStandard(req.standard); // throws UNKNOWN_PRESET

  let masonryVolumeCum: number;
  let wallSection: BrickResponse["wall"] | undefined;

  if (req.mode === "wall") {
    const lengthM = lengthToMeters(req.wall.length);
    const heightM = lengthToMeters(req.wall.height);
    const thicknessM = lengthToMeters(req.wall.thickness);

    const grossAreaSqm = lengthM * heightM;
    const openingsSqm = openingsAreaSqm(req.openings);

    if (openingsSqm >= grossAreaSqm) {
      throw new Error(
        `OPENINGS_EXCEED_WALL:${openingsSqm.toFixed(2)}>=${grossAreaSqm.toFixed(2)}`,
      );
    }

    const netAreaSqm = grossAreaSqm - openingsSqm;
    masonryVolumeCum = netAreaSqm * thicknessM;

    wallSection = {
      grossArea: { value: grossAreaSqm.toFixed(2), unit: "sqm" },
      openingsArea: { value: openingsSqm.toFixed(2), unit: "sqm" },
      netArea: { value: netAreaSqm.toFixed(2), unit: "sqm" },
      volume: asVolumeQuantity(masonryVolumeCum, "cum", 2),
    };
  } else {
    masonryVolumeCum = volumeToCum(req.volume);
  }

  const out = computeBrickQuantities({ params, masonryVolumeCum });

  const response: BrickResponse = {
    input: { mode: req.mode },
    standardUsed: {
      preset: req.standard?.preset ?? "modular-indian",
      effectiveParameters: {
        brickSize: params.brickSize,
        mortarThickness: params.mortarThickness,
        mortarRatio: params.mortarRatio,
        wastagePercent: params.wastagePercent,
        mortarWastagePercent: params.mortarWastagePercent,
      },
    },
    quantities: {
      bricks: {
        value: String(out.bricksWithWastage),
        unit: "pcs",
        beforeWastage: String(out.bricksBeforeWastage),
        wastagePercent: params.wastagePercent,
      },
      mortar: {
        volume: asVolumeQuantity(out.mortarVolumeCum, "cum", 2),
        cement: { value: out.cementBags.toFixed(1), unit: "bags" },
        sand: { value: out.sandCft.toFixed(1), unit: "cft" },
        wastageIncluded: params.mortarWastagePercent,
      },
    },
    ...(wallSection ? { wall: wallSection } : {}),
  };

  return response;
}
