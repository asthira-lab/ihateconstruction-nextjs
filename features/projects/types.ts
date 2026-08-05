// TS types for the Projects feature. Wire shape (camelCase) vs DB row (snake_case) split.

import { z } from "zod";
import {
  projectCreateSchema,
  projectPatchSchema,
  projectStatusSchema,
  listProjectsQuerySchema,
  locationSchema,
} from "./schema";

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectLocation = z.infer<typeof locationSchema>;
export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectPatch = z.infer<typeof projectPatchSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export interface ProjectCounts {
  calculations: number;
  materials: number;
  boqs: number;
  quotations: number;
  invoices: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string | null;
  location: ProjectLocation | null;
  currency: string;
  taxRegion: string;
  status: ProjectStatus;
  notes: string | null;
  counts: ProjectCounts;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  client_name: string | null;
  location: ProjectLocation | null;
  currency: string;
  tax_region: string;
  status: ProjectStatus;
  notes: string | null;
  counts_calculations: number;
  counts_materials: number;
  counts_boqs: number;
  counts_quotations: number;
  counts_invoices: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export function toWireProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    location: row.location,
    currency: row.currency.trim(),
    taxRegion: row.tax_region.trim(),
    status: row.status,
    notes: row.notes,
    counts: {
      calculations: row.counts_calculations,
      materials: row.counts_materials,
      boqs: row.counts_boqs,
      quotations: row.counts_quotations,
      invoices: row.counts_invoices,
    },
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
  };
}

export type ProjectErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "UNKNOWN_FIELD"
  | "NOT_FOUND"
  | "IMMUTABLE_FIELD"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "ALREADY_ARCHIVED"
  | "NOT_ARCHIVED";

export type ProjectActionResult =
  | { ok: true; data: Project }
  | { ok: false; error: { code: ProjectErrorCode | "INTERNAL"; message: string; details?: unknown } };

export type ListProjectsActionResult =
  | { ok: true; data: { items: Project[]; nextCursor: string | null; hasMore: boolean } }
  | { ok: false; error: { code: ProjectErrorCode | "INTERNAL"; message: string; details?: unknown } };

export type DeleteProjectActionResult =
  | { ok: true }
  | { ok: false; error: { code: ProjectErrorCode | "INTERNAL"; message: string; details?: unknown } };
