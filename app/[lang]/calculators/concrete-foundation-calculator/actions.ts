"use server";

// Server Action for the concrete-foundation calculator.

import { concreteFoundationRequestSchema } from "@/features/calculators/concrete-foundation";
import { computeConcreteFoundation } from "@/features/calculators/concrete-foundation/compute";
import type { ConcreteFoundationActionResult } from "@/features/calculators/concrete-foundation";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// TODO: add domain-specific error codes here.
type ConcreteFoundationErrorCode = "UNKNOWN_INPUT";

const CATALOG: ErrorCatalog<ConcreteFoundationErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteFoundationCalculation(raw: unknown): Promise<ConcreteFoundationActionResult> {
  const parsed = concreteFoundationRequestSchema.safeParse(raw);
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
    const data = await computeConcreteFoundation(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteFoundationActionResult;
  }
}