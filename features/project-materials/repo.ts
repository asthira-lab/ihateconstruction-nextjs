// Parameterized queries for project materials. user_id denormalized for ownership filter.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type { CursorPayload } from "@/lib/cursor";
import type {
  ListMaterialsQuery,
  MaterialPatch,
  MaterialType,
  ProjectMaterial,
  ProjectMaterialRow,
} from "./types";
import { toWireMaterial } from "./types";

type Executor = Pick<PoolClient, "query">;

const COLS = `id, project_id, user_id, type, brand, unit, unit_price::text AS unit_price, quantity::text AS quantity,
  currency, vendor, notes, effective_from, created_at, updated_at`;

export interface InsertMaterialInput {
  projectId: string;
  userId: string;
  currency: string;
  type: MaterialType;
  unit: string;
  unitPrice: string;
  quantity?: string | null;
  brand?: string | null;
  vendor?: string | null;
  notes?: string | null;
  effectiveFrom?: string;
}

export async function insertMaterial(
  input: InsertMaterialInput,
  client: Executor = getDb(),
): Promise<ProjectMaterial> {
  const res = await client.query<ProjectMaterialRow>(
    `INSERT INTO project_materials
       (project_id, user_id, type, brand, unit, unit_price, quantity, currency, vendor, notes, effective_from)
     VALUES ($1, $2, $3, $4, $5, $6::numeric, $7::numeric, $8, $9, $10, COALESCE($11::timestamptz, NOW()))
     RETURNING ${COLS}`,
    [
      input.projectId,
      input.userId,
      input.type,
      input.brand ?? null,
      input.unit,
      input.unitPrice,
      input.quantity ?? null,
      input.currency,
      input.vendor ?? null,
      input.notes ?? null,
      input.effectiveFrom ?? null,
    ],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Insert returned no row.");
  return toWireMaterial(row);
}

export async function findMaterialByIdForUser(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<ProjectMaterial | undefined> {
  const res = await client.query<ProjectMaterialRow>(
    `SELECT ${COLS} FROM project_materials WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? toWireMaterial(row) : undefined;
}

export async function listMaterialsForProject(
  projectId: string,
  userId: string,
  q: ListMaterialsQuery,
  cursor: CursorPayload | null,
  client: Executor = getDb(),
): Promise<{ items: ProjectMaterial[]; nextCursor: CursorPayload | null; hasMore: boolean }> {
  const conditions: string[] = ["project_id = $1", "user_id = $2"];
  const params: unknown[] = [projectId, userId];

  if (q.type) {
    params.push(q.type);
    conditions.push(`type = $${params.length}`);
  }
  if (cursor) {
    params.push(cursor.createdAt);
    params.push(cursor.id);
    conditions.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }

  params.push(q.limit + 1);
  const res = await client.query<ProjectMaterialRow>(
    `SELECT ${COLS} FROM project_materials
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length}`,
    params,
  );

  const rows = res.rows;
  const hasMore = rows.length > q.limit;
  const kept = hasMore ? rows.slice(0, q.limit) : rows;
  const last = kept[kept.length - 1];
  return {
    items: kept.map(toWireMaterial),
    nextCursor: hasMore && last ? { createdAt: last.created_at.toISOString(), id: last.id } : null,
    hasMore,
  };
}

export async function patchMaterialRow(
  id: string,
  userId: string,
  patch: MaterialPatch,
  client: Executor = getDb(),
): Promise<ProjectMaterial | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const push = (col: string, val: unknown, cast?: string) => {
    params.push(val);
    sets.push(`${col} = $${params.length}${cast ? `::${cast}` : ""}`);
  };

  if (patch.brand !== undefined) push("brand", patch.brand);
  if (patch.unitPrice !== undefined) push("unit_price", patch.unitPrice, "numeric");
  if (patch.quantity !== undefined) push("quantity", patch.quantity, "numeric");
  if (patch.vendor !== undefined) push("vendor", patch.vendor);
  if (patch.notes !== undefined) push("notes", patch.notes);
  if (patch.effectiveFrom !== undefined) push("effective_from", patch.effectiveFrom, "timestamptz");

  if (!sets.length) return findMaterialByIdForUser(id, userId, client);

  sets.push(`updated_at = NOW()`);
  params.push(id);
  params.push(userId);

  const res = await client.query<ProjectMaterialRow>(
    `UPDATE project_materials SET ${sets.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING ${COLS}`,
    params,
  );
  const row = res.rows[0];
  return row ? toWireMaterial(row) : undefined;
}

export async function deleteMaterialRow(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<{ deleted: boolean; projectId?: string }> {
  const res = await client.query<{ project_id: string }>(
    `DELETE FROM project_materials WHERE id = $1 AND user_id = $2 RETURNING project_id`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? { deleted: true, projectId: row.project_id } : { deleted: false };
}
