"use server";

// Server Actions for saved calculations. Wraps service + normalizeCalcError.

import { normalizeCalcError } from "@/features/calculators/errors";
import { CALCULATION_CATALOG } from "@/features/project-calculations";
import type {
  CalculationActionResult,
  DeleteCalculationActionResult,
  ListCalculationsActionResult,
} from "@/features/project-calculations";
import {
  deleteCalculation,
  getCalculation,
  listActiveProjectsForPicker,
  listCalculations,
  patchCalculation,
  recomputeCalculation,
  saveCalculation,
} from "@/features/project-calculations/service";

export async function saveCalculationAction(
  projectId: string,
  raw: unknown,
): Promise<CalculationActionResult> {
  try {
    const data = await saveCalculation(projectId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CALCULATION_CATALOG) as CalculationActionResult;
  }
}

export async function getCalculationAction(id: string): Promise<CalculationActionResult> {
  try {
    const data = await getCalculation(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CALCULATION_CATALOG) as CalculationActionResult;
  }
}

export async function listCalculationsAction(
  projectId: string,
  rawQuery: unknown,
): Promise<ListCalculationsActionResult> {
  try {
    const data = await listCalculations(projectId, rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CALCULATION_CATALOG) as ListCalculationsActionResult;
  }
}

export async function patchCalculationAction(
  id: string,
  raw: unknown,
): Promise<CalculationActionResult> {
  try {
    const data = await patchCalculation(id, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CALCULATION_CATALOG) as CalculationActionResult;
  }
}

export async function recomputeCalculationAction(id: string): Promise<CalculationActionResult> {
  try {
    const data = await recomputeCalculation(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, CALCULATION_CATALOG) as CalculationActionResult;
  }
}

export async function deleteCalculationAction(id: string): Promise<DeleteCalculationActionResult> {
  try {
    await deleteCalculation(id);
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, CALCULATION_CATALOG) as DeleteCalculationActionResult;
  }
}

export async function listActiveProjectsForPickerAction(): Promise<
  { ok: true; data: Array<{ id: string; name: string }> } | { ok: false; error: { message: string } }
> {
  try {
    const data = await listActiveProjectsForPicker();
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "";
    const message = raw.startsWith("UNAUTHENTICATED")
      ? "You need to sign in first."
      : "Couldn't load your projects. Try again.";
    return { ok: false, error: { message } };
  }
}
