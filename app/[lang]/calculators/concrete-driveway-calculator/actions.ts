"use server";

// Server Action for the concrete-driveway calculator.

import { concreteDrivewayRequestSchema } from "@/features/calculators/concrete-driveway";
import { computeConcreteDriveway } from "@/features/calculators/concrete-driveway/compute";
import type { ConcreteDrivewayActionResult } from "@/features/calculators/concrete-driveway";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// TODO: add domain-specific error codes here.
type ConcreteDrivewayErrorCode = "UNKNOWN_INPUT";

const CATALOG: ErrorCatalog<ConcreteDrivewayErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteDrivewayCalculation(raw: unknown): Promise<ConcreteDrivewayActionResult> {
  const parsed = concreteDrivewayRequestSchema.safeParse(raw);
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
  try {
    const data = await computeConcreteDriveway(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteDrivewayActionResult;
  }
}