"use server";

// Server Action for the concrete-staircase calculator.

import { concreteStaircaseRequestSchema } from "@/features/calculators/concrete-staircase";
import { computeConcreteStaircase } from "@/features/calculators/concrete-staircase/compute";
import type { ConcreteStaircaseActionResult } from "@/features/calculators/concrete-staircase";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// Domain-specific error codes.
type ConcreteStaircaseErrorCode = "UNKNOWN_INPUT" | "INVALID_STEP_COUNT" | "INVALID_DIMENSIONS";

const CATALOG: ErrorCatalog<ConcreteStaircaseErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INVALID_STEP_COUNT: "Step count must be a positive integer.",
  INVALID_DIMENSIONS: "Rise, run, and width must be positive values.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteStaircaseCalculation(raw: unknown): Promise<ConcreteStaircaseActionResult> {
  const parsed = concreteStaircaseRequestSchema.safeParse(raw);
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
    const data = await computeConcreteStaircase(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteStaircaseActionResult;
  }
}