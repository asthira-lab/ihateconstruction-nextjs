// TS types for saved calculations. Wire vs DB row split, plus action result union.

import { z } from "zod";
import type {
  listCalculationsQuerySchema,
  savedCalculationCreateSchema,
  savedCalculationPatchSchema,
} from "./schema";
import type { CalculatorSlug } from "./schema";

export type { CalculatorSlug };

export type SavedCalculationCreate = z.infer<typeof savedCalculationCreateSchema>;
export type SavedCalculationPatch = z.infer<typeof savedCalculationPatchSchema>;
export type ListCalculationsQuery = z.infer<typeof listCalculationsQuerySchema>;

export interface SavedCalculation {
  id: string;
  projectId: string;
  calculator: CalculatorSlug;
  label: string;
  description: string | null;
  group: string | null;
  request: Record<string, unknown>;
  result: Record<string, unknown>;
  computedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedCalculationRow {
  id: string;
  project_id: string;
  user_id: string;
  calculator: CalculatorSlug;
  label: string;
  description: string | null;
  group_name: string | null;
  request: Record<string, unknown>;
  result: Record<string, unknown>;
  computed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export function toWireCalculation(row: SavedCalculationRow): SavedCalculation {
  return {
    id: row.id,
    projectId: row.project_id,
    calculator: row.calculator,
    label: row.label,
    description: row.description,
    group: row.group_name,
    request: row.request,
    result: row.result,
    computedAt: row.computed_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export type CalculationErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "UNKNOWN_FIELD"
  | "UNKNOWN_CALCULATOR"
  | "NOT_FOUND"
  | "IMMUTABLE_FIELD"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "PROJECT_ARCHIVED"
  | "COMPUTE_FAILED";

export type CalculationActionResult =
  | { ok: true; data: SavedCalculation }
  | { ok: false; error: { code: CalculationErrorCode | "INTERNAL"; message: string; details?: unknown } };

export type ListCalculationsActionResult =
  | { ok: true; data: { items: SavedCalculation[]; nextCursor: string | null; hasMore: boolean } }
  | { ok: false; error: { code: CalculationErrorCode | "INTERNAL"; message: string; details?: unknown } };

export type DeleteCalculationActionResult =
  | { ok: true }
  | { ok: false; error: { code: CalculationErrorCode | "INTERNAL"; message: string; details?: unknown } };
