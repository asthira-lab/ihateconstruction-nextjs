// Server Actions for BOQ operations

"use server";

import { normalizeCalcError } from "@/features/calculators/errors";
import { BOQ_CATALOG } from "@/features/project-boqs";
import type { Boq } from "@/features/project-boqs";
import {
  generateBoq,
  getBoq,
  listBoqs,
  patchBoq,
  regenerateBoq,
  deleteBoq,
  swapMaterialBrand,
  type ListBoqsResult,
} from "@/features/project-boqs/service";

export interface BoqActionResult {
  ok: true;
  data: Boq;
}

export interface ListBoqsActionResult {
  ok: true;
  data: ListBoqsResult;
}

export interface DeleteBoqActionResult {
  ok: true;
}

type ErrorResult = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

export async function generateBoqAction(projectId: string, raw: unknown): Promise<BoqActionResult | ErrorResult> {
  try {
    const data = await generateBoq(projectId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}

export async function getBoqAction(boqId: string): Promise<BoqActionResult | ErrorResult> {
  try {
    const data = await getBoq(boqId);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}

export async function listBoqsAction(projectId: string, rawQuery: unknown): Promise<ListBoqsActionResult | ErrorResult> {
  try {
    const data = await listBoqs(projectId, rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}

export async function patchBoqAction(boqId: string, raw: unknown): Promise<BoqActionResult | ErrorResult> {
  try {
    const data = await patchBoq(boqId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}

export async function regenerateBoqAction(boqId: string, raw?: unknown): Promise<BoqActionResult | ErrorResult> {
  try {
    const data = await regenerateBoq(boqId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}

export async function deleteBoqAction(boqId: string): Promise<DeleteBoqActionResult | ErrorResult> {
  try {
    await deleteBoq(boqId);
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}

export async function swapBrandAction(boqId: string, raw: unknown): Promise<BoqActionResult | ErrorResult> {
  try {
    const data = await swapMaterialBrand(boqId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, BOQ_CATALOG) as ErrorResult;
  }
}
