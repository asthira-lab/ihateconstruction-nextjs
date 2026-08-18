"use server";

// Server Action for the concrete-footing calculator.

import { concreteFootingRequestSchema } from "@/features/calculators/concrete-footing";
import { computeConcreteFooting } from "@/features/calculators/concrete-footing/compute";
import type { ConcreteFootingActionResult } from "@/features/calculators/concrete-footing";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// TODO: add domain-specific error codes here.
type ConcreteFootingErrorCode = "UNKNOWN_INPUT";

const CATALOG: ErrorCatalog<ConcreteFootingErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteFootingCalculation(raw: unknown): Promise<ConcreteFootingActionResult> {
  const parsed = concreteFootingRequestSchema.safeParse(raw);
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
    const data = await computeConcreteFooting(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteFootingActionResult;
  }
}
