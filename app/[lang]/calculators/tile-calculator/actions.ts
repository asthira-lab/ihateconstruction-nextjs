"use server";

// Server Action for the tile calculator. Server-side validation + compute.

import { tileRequestSchema } from "@/features/calculators/tile";
import { computeTile } from "@/features/calculators/tile/compute";
import type { TileActionResult } from "@/features/calculators/tile";
import {
  normalizeCalcError,
  type ErrorCatalog,
} from "@/features/calculators/errors";

type TileErrorCode =
  | "UNKNOWN_SURFACE_TYPE"
  | "UNKNOWN_ADHESIVE_METHOD"
  | "EXCLUSIONS_EXCEED_SURFACE"
  | "UNKNOWN_PRESET"
  | "UNKNOWN_CUSTOM_KEY";

const CATALOG: ErrorCatalog<TileErrorCode> = {
  UNKNOWN_SURFACE_TYPE: "Surface type must be either floor or wall.",
  UNKNOWN_ADHESIVE_METHOD:
    "Adhesive method must be either thin-set or mortar-bed.",
  EXCLUSIONS_EXCEED_SURFACE:
    "Excluded areas add up to more than the surface itself. Check the dimensions.",
  UNKNOWN_PRESET: "That tile preset isn't recognised. Pick one from the list.",
  UNKNOWN_CUSTOM_KEY: "One of the custom parameters isn't supported.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitTileCalculation(
  raw: unknown,
): Promise<TileActionResult> {
  // 1. Server-side validation — never trust the client alone.
  const parsed = tileRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Some of the inputs look wrong. Check the highlighted fields.",
        details: parsed.error.flatten(),
      },
    };
  }

  // 2. Compute (server-side; transparent to the client).
  try {
    const data = await computeTile(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as TileActionResult;
  }
}
