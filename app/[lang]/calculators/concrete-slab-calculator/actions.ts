"use server";

// Server Action for the concrete-slab calculator.

import { concreteSlabRequestSchema } from "@/features/calculators/concrete-slab";
import { computeConcreteSlab } from "@/features/calculators/concrete-slab/compute";
import type { ConcreteSlabActionResult } from "@/features/calculators/concrete-slab";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// TODO: add domain-specific error codes here.
type ConcreteSlabErrorCode = "UNKNOWN_INPUT";

const CATALOG: ErrorCatalog<ConcreteSlabErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteSlabCalculation(raw: unknown): Promise<ConcreteSlabActionResult> {
  const parsed = concreteSlabRequestSchema.safeParse(raw);
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
    const data = await computeConcreteSlab(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteSlabActionResult;
  }
}