"use server";

// Server Action for the concrete-wall calculator.

import { concreteWallRequestSchema } from "@/features/calculators/concrete-wall";
import { computeConcreteWall } from "@/features/calculators/concrete-wall/compute";
import type { ConcreteWallActionResult } from "@/features/calculators/concrete-wall";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// TODO: add domain-specific error codes here.
type ConcreteWallErrorCode = "UNKNOWN_INPUT";

const CATALOG: ErrorCatalog<ConcreteWallErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteWallCalculation(raw: unknown): Promise<ConcreteWallActionResult> {
  const parsed = concreteWallRequestSchema.safeParse(raw);
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
    const data = await computeConcreteWall(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteWallActionResult;
  }
}