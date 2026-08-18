"use server";

// Server Action for the concrete-volume calculator.

import { concreteVolumeRequestSchema } from "@/features/calculators/concrete-volume";
import { computeConcreteVolume } from "@/features/calculators/concrete-volume/compute";
import type { ConcreteVolumeActionResult } from "@/features/calculators/concrete-volume";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

// TODO: add domain-specific error codes here.
type ConcreteVolumeErrorCode = "UNKNOWN_INPUT";

const CATALOG: ErrorCatalog<ConcreteVolumeErrorCode> = {
  UNKNOWN_INPUT: "One of the inputs isn't recognised.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitConcreteVolumeCalculation(raw: unknown): Promise<ConcreteVolumeActionResult> {
  const parsed = concreteVolumeRequestSchema.safeParse(raw);
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
    const data = await computeConcreteVolume(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ConcreteVolumeActionResult;
  }
}
