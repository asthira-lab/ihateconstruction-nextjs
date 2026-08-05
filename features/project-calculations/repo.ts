// Parameterized queries for saved calculations. user_id denormalized for direct ownership filter.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type { CursorPayload } from "@/lib/cursor";
import type {
  CalculatorSlug,
  ListCalculationsQuery,
  SavedCalculation,
  SavedCalculationPatch,
  SavedCalculationRow,
} from "./types";
import { toWireCalculation } from "./types";

type Executor = Pick<PoolClient, "query">;

const COLS = `id, project_id, user_id, calculator, label, description, group_name,
  request, result, computed_at, created_at, updated_at`;

export interface InsertCalcInput {
  projectId: string;
  userId: string;
  calculator: CalculatorSlug;
  label: string;
  description?: string | null;
  group?: string | null;
  request: Record<string, unknown>;
  result: Record<string, unknown>;
}

export async function insertCalculation(
  input: InsertCalcInput,
  client: Executor = getDb(),
): Promise<SavedCalculation> {
  const res = await client.query<SavedCalculationRow>(
    `INSERT INTO project_calculations
       (project_id, user_id, calculator, label, description, group_name, request, result)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
     RETURNING ${COLS}`,
    [
      input.projectId,
      input.userId,
      input.calculator,
      input.label,
      input.description ?? null,
      input.group ?? null,
      JSON.stringify(input.request),
      JSON.stringify(input.result),
    ],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Insert returned no row.");
  return toWireCalculation(row);
}

export async function findCalculationByIdForUser(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<SavedCalculation | undefined> {
  const res = await client.query<SavedCalculationRow>(
    `SELECT ${COLS} FROM project_calculations WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? toWireCalculation(row) : undefined;
}

export async function listCalculationsForProject(
  projectId: string,
  userId: string,
  q: ListCalculationsQuery,
  cursor: CursorPayload | null,
  client: Executor = getDb(),
): Promise<{ items: SavedCalculation[]; nextCursor: CursorPayload | null; hasMore: boolean }> {
  const conditions: string[] = ["project_id = $1", "user_id = $2"];
  const params: unknown[] = [projectId, userId];

  if (q.calculator) {
    params.push(q.calculator);
    conditions.push(`calculator = $${params.length}`);
  }
  if (q.group) {
    params.push(q.group);
    conditions.push(`group_name = $${params.length}`);
  }
  if (cursor) {
    params.push(cursor.createdAt);
    params.push(cursor.id);
    conditions.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }

  params.push(q.limit + 1);
  const res = await client.query<SavedCalculationRow>(
    `SELECT ${COLS} FROM project_calculations
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
    items: kept.map(toWireCalculation),
    nextCursor: hasMore && last ? { createdAt: last.created_at.toISOString(), id: last.id } : null,
    hasMore,
  };
}

export async function patchCalculationRow(
  id: string,
  userId: string,
  patch: SavedCalculationPatch,
  client: Executor = getDb(),
): Promise<SavedCalculation | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const push = (col: string, val: unknown) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };

  if (patch.label !== undefined) push("label", patch.label);
  if (patch.description !== undefined) push("description", patch.description);
  if (patch.group !== undefined) push("group_name", patch.group);

  if (!sets.length) return findCalculationByIdForUser(id, userId, client);

  sets.push(`updated_at = NOW()`);
  params.push(id);
  params.push(userId);

  const res = await client.query<SavedCalculationRow>(
    `UPDATE project_calculations SET ${sets.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING ${COLS}`,
    params,
  );
  const row = res.rows[0];
  return row ? toWireCalculation(row) : undefined;
}

export async function recomputeCalculationRow(
  id: string,
  userId: string,
  request: Record<string, unknown>,
  result: Record<string, unknown>,
  client: Executor = getDb(),
): Promise<SavedCalculation | undefined> {
  const res = await client.query<SavedCalculationRow>(
    `UPDATE project_calculations
     SET request = $3::jsonb, result = $4::jsonb, computed_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLS}`,
    [id, userId, JSON.stringify(request), JSON.stringify(result)],
  );
  const row = res.rows[0];
  return row ? toWireCalculation(row) : undefined;
}

export async function deleteCalculationRow(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<{ deleted: boolean; projectId?: string }> {
  const res = await client.query<{ project_id: string }>(
    `DELETE FROM project_calculations WHERE id = $1 AND user_id = $2 RETURNING project_id`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? { deleted: true, projectId: row.project_id } : { deleted: false };
}
