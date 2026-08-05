"use server";

/**
 * The one Server Action the paint calculator form can invoke.
 *
 * Validation + compute both happen server-side. The client never imports
 * compute.ts / formula.ts / server-compute.ts — those are `import "server-only"`
 * and would break the client bundle if pulled in.
 *
 * Server Actions are POSTable outside the UI, so validation lives here, not
 * only in the form.
 */

import { paintRequestSchema } from "@/features/calculators/paint";
import { computePaint } from "@/features/calculators/paint/compute";
import type { PaintActionResult } from "@/features/calculators/paint";
import {
  normalizeCalcError,
  type ErrorCatalog,
} from "@/features/calculators/errors";

type PaintErrorCode =
  | "OPENINGS_EXCEED_WALL"
  | "UNKNOWN_PRESET"
  | "UNKNOWN_MODE"
  | "UNKNOWN_LAYER_TYPE"
  | "UNKNOWN_CUSTOM_KEY";

const CATALOG: ErrorCatalog<PaintErrorCode> = {
  OPENINGS_EXCEED_WALL:
    "Openings are larger than the walls themselves. Reduce door/window sizes or increase room dimensions.",
  UNKNOWN_PRESET:
    "That paint preset isn't recognised. Pick one from the list.",
  UNKNOWN_MODE: "Calculator mode not recognised.",
  UNKNOWN_LAYER_TYPE: "That layer type isn't recognised.",
  UNKNOWN_CUSTOM_KEY: "One of the custom parameters isn't supported.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitPaintCalculation(
  raw: unknown,
): Promise<PaintActionResult> {
  // 1. Server-side validation. Client validation is UX polish, not trust.
  const parsed = paintRequestSchema.safeParse(raw);
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
    const data = await computePaint(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as PaintActionResult;
  }
}
