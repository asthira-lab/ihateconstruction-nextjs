"use server";

// Server Action for the rebar calculator.

import { rebarRequestSchema } from "@/features/calculators/rebar";
import { computeRebar } from "@/features/calculators/rebar/compute";
import type { RebarActionResult } from "@/features/calculators/rebar";
import { normalizeCalcError, type ErrorCatalog } from "@/features/calculators/errors";

type RebarErrorCode = "UNKNOWN_MEMBER" | "UNKNOWN_CUSTOM_KEY";

const CATALOG: ErrorCatalog<RebarErrorCode> = {
  UNKNOWN_MEMBER: "That member type isn't recognised.",
  UNKNOWN_CUSTOM_KEY: "One of the custom parameters isn't supported.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitRebarCalculation(raw: unknown): Promise<RebarActionResult> {
  const parsed = rebarRequestSchema.safeParse(raw);
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
    const data = await computeRebar(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as RebarActionResult;
  }
}
