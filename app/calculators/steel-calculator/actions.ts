"use server";

// Server Action for the steel calculator.

import { steelRequestSchema } from "@/features/calculators/steel";
import { computeSteel } from "@/features/calculators/steel/compute";
import type { SteelActionResult } from "@/features/calculators/steel";
import {
  normalizeCalcError,
  type ErrorCatalog,
} from "@/features/calculators/errors";

type SteelErrorCode =
  | "UNKNOWN_PRESET"
  | "UNKNOWN_MODE"
  | "UNKNOWN_MEMBER"
  | "UNKNOWN_CUSTOM_KEY";

const CATALOG: ErrorCatalog<SteelErrorCode> = {
  UNKNOWN_PRESET:
    "That steel standard isn't recognised. Pick one from the list.",
  UNKNOWN_MODE: "Calculator mode not recognised.",
  UNKNOWN_MEMBER: "That member type isn't recognised.",
  UNKNOWN_CUSTOM_KEY: "One of the custom parameters isn't supported.",
  INTERNAL: "Something went wrong while calculating. Try again.",
};

export async function submitSteelCalculation(
  raw: unknown,
): Promise<SteelActionResult> {
  const parsed = steelRequestSchema.safeParse(raw);
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
    const data = await computeSteel(parsed.data);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as SteelActionResult;
  }
}
