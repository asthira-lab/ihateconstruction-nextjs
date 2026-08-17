"use server";

/**
 * The one Server Action the brick calculator client form can invoke.
 *
 * Everything meaningful (Zod validation, the compute call) happens here on
 * the server. The client never imports compute.ts / formula.ts — those are
 * marked `import "server-only"` and would break the client bundle.
 *
 * Note: Server Actions are reachable via direct POST regardless of UI, so
 * validation lives INSIDE this function, not just in the client form.
 */

import { brickRequestSchema } from "@/features/calculators/brick";
import { computeBrick } from "@/features/calculators/brick/compute";
import type { BrickActionResult } from "@/features/calculators/brick";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// Every domain error this action can surface, mapped to user-facing copy.
// Additions here must also appear in the union in BrickActionResult's error.code.
type BrickErrorCode =
  | "OPENINGS_EXCEED_WALL"
  | "UNKNOWN_PRESET"
  | "UNKNOWN_MODE"
  | "UNKNOWN_CUSTOM_KEY";

const CATALOG: ErrorCatalog<BrickErrorCode> = {
  OPENINGS_EXCEED_WALL:
    "Openings are larger than the wall itself. Reduce door/window sizes or increase wall dimensions.",
  UNKNOWN_PRESET: "That brick standard isn't recognised. Pick one from the list.",
  UNKNOWN_MODE: "Calculator mode not recognised.",
  UNKNOWN_CUSTOM_KEY: "One of the custom parameters isn't supported.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitBrickCalculation(
  raw: unknown,
): Promise<BrickActionResult> {
  // 1. Server-side validation. Client validation is UX polish, not trust.
  const parsed = brickRequestSchema.safeParse(raw);
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
    const data = await computeBrick(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as BrickActionResult;
  }
}
