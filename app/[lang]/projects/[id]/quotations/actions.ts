// Server Actions for quotation operations

"use server";

import { normalizeCalcError } from "@/features/calculators/errors";
import { QUOTATION_CATALOG } from "@/features/project-quotations";
import type { Quotation } from "@/features/project-quotations";
import {
  generateQuotation,
  getQuotation,
  listQuotations,
  patchQuotation,
  updateQuotationStatus,
  deleteQuotation,
  type ListQuotationsResult,
} from "@/features/project-quotations/service";

type ErrorResult = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

export async function generateQuotationAction(projectId: string, raw: unknown): Promise<{ ok: true; data: Quotation } | ErrorResult> {
  try {
    const data = await generateQuotation(projectId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, QUOTATION_CATALOG) as ErrorResult;
  }
}

export async function getQuotationAction(id: string): Promise<{ ok: true; data: Quotation } | ErrorResult> {
  try {
    const data = await getQuotation(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, QUOTATION_CATALOG) as ErrorResult;
  }
}

export async function listQuotationsAction(projectId: string, rawQuery: unknown): Promise<{ ok: true; data: ListQuotationsResult } | ErrorResult> {
  try {
    const data = await listQuotations(projectId, rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, QUOTATION_CATALOG) as ErrorResult;
  }
}

export async function patchQuotationAction(id: string, raw: unknown): Promise<{ ok: true; data: Quotation } | ErrorResult> {
  try {
    const data = await patchQuotation(id, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, QUOTATION_CATALOG) as ErrorResult;
  }
}

export async function updateStatusAction(id: string, status: string): Promise<{ ok: true; data: Quotation } | ErrorResult> {
  try {
    const data = await updateQuotationStatus(id, status);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, QUOTATION_CATALOG) as ErrorResult;
  }
}

export async function deleteQuotationAction(id: string): Promise<{ ok: true } | ErrorResult> {
  try {
    await deleteQuotation(id);
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, QUOTATION_CATALOG) as ErrorResult;
  }
}
