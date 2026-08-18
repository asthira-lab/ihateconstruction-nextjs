"use server";

/**
 * The one Server Action the concrete calculator form can invoke.
 *
 * Validation + compute both happen server-side. The client never imports
 * compute.ts / formula.ts / server-compute.ts — those are `import "server-only"`
 * and would break the client bundle if pulled in.
 *
 * Server Actions are POSTable outside the UI, so validation lives here, not
 * only in the form.
 */

import { concreteRequestSchema } from "@/features/calculators/concrete";
import { computeConcrete } from "@/features/calculators/concrete/compute";
import type { ConcreteActionResult } from "@/features/calculators/concrete";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

type ConcreteErrorCode = "UNKNOWN_PRESET" | "UNKNOWN_CUSTOM_KEY";

const CATALOG: ErrorCatalog<ConcreteErrorCode> = {
  UNKNOWN_PRESET:
    "That concrete grade isn't recognised. Pick one from the list.",
  UNKNOWN_CUSTOM_KEY: "One of the custom parameters isn't supported.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteCalculation(
  raw: unknown,
): Promise<ConcreteActionResult> {
  // 1. Server-side validation. Client validation is UX polish, not trust.
  const parsed = concreteRequestSchema.safeParse(raw);
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
    const data = await computeConcrete(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteActionResult;
  }
}
