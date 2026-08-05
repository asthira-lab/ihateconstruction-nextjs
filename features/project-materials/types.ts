// TS types for project materials.

import { z } from "zod";
import type {
  listMaterialsQuerySchema,
  materialCreateSchema,
  materialPatchSchema,
  MaterialType,
} from "./schema";

export type { MaterialType };
export type MaterialCreate = z.infer<typeof materialCreateSchema>;
export type MaterialPatch = z.infer<typeof materialPatchSchema>;
export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>;

export interface ProjectMaterial {
  id: string;
  projectId: string;
  type: MaterialType;
  brand: string | null;
  unit: string;
  unitPrice: string;
  quantity: string | null;
  currency: string;
  vendor: string | null;
  notes: string | null;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMaterialRow {
  id: string;
  project_id: string;
  user_id: string;
  type: MaterialType;
  brand: string | null;
  unit: string;
  unit_price: string;
  quantity: string | null;
  currency: string;
  vendor: string | null;
  notes: string | null;
  effective_from: Date;
  created_at: Date;
  updated_at: Date;
}

export function toWireMaterial(row: ProjectMaterialRow): ProjectMaterial {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    brand: row.brand,
    unit: row.unit,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    currency: row.currency.trim(),
    vendor: row.vendor,
    notes: row.notes,
    effectiveFrom: row.effective_from.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export type MaterialErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "UNKNOWN_FIELD"
  | "UNIT_NOT_ALLOWED_FOR_TYPE"
  | "NOT_FOUND"
  | "IMMUTABLE_FIELD"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "PROJECT_ARCHIVED";

export type MaterialActionResult =
  | { ok: true; data: ProjectMaterial }
  | { ok: false; error: { code: MaterialErrorCode | "INTERNAL"; message: string; details?: unknown } };

export type ListMaterialsActionResult =
  | { ok: true; data: { items: ProjectMaterial[]; nextCursor: string | null; hasMore: boolean } }
  | { ok: false; error: { code: MaterialErrorCode | "INTERNAL"; message: string; details?: unknown } };

export type DeleteMaterialActionResult =
  | { ok: true }
  | { ok: false; error: { code: MaterialErrorCode | "INTERNAL"; message: string; details?: unknown } };
