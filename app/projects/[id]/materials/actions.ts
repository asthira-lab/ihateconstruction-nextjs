"use server";

// Server Actions for project materials.

import { normalizeCalcError } from "@/features/calculators/errors";
import { MATERIAL_CATALOG } from "@/features/project-materials";
import type {
  DeleteMaterialActionResult,
  ListMaterialsActionResult,
  MaterialActionResult,
} from "@/features/project-materials";
import {
  bulkImportMaterials,
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  patchMaterial,
} from "@/features/project-materials/service";
import type { MaterialType } from "@/features/project-materials";

export async function createMaterialAction(projectId: string, raw: unknown): Promise<MaterialActionResult> {
  try {
    const data = await createMaterial(projectId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, MATERIAL_CATALOG) as MaterialActionResult;
  }
}

export async function getMaterialAction(id: string): Promise<MaterialActionResult> {
  try {
    const data = await getMaterial(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, MATERIAL_CATALOG) as MaterialActionResult;
  }
}

export async function listMaterialsAction(
  projectId: string,
  rawQuery: unknown,
): Promise<ListMaterialsActionResult> {
  try {
    const data = await listMaterials(projectId, rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, MATERIAL_CATALOG) as ListMaterialsActionResult;
  }
}

export async function patchMaterialAction(id: string, raw: unknown): Promise<MaterialActionResult> {
  try {
    const data = await patchMaterial(id, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, MATERIAL_CATALOG) as MaterialActionResult;
  }
}

export async function deleteMaterialAction(id: string): Promise<DeleteMaterialActionResult> {
  try {
    await deleteMaterial(id);
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, MATERIAL_CATALOG) as DeleteMaterialActionResult;
  }
}

export type BulkImportResult =
  | { ok: true; data: { created: number; updated: number } }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export async function bulkImportMaterialsAction(
  projectId: string,
  suggestions: Array<{ type: MaterialType; unit: string; quantity?: string | null }>,
): Promise<BulkImportResult> {
  try {
    const data = await bulkImportMaterials(projectId, suggestions);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, MATERIAL_CATALOG) as BulkImportResult;
  }
}
