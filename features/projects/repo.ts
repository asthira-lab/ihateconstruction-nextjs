// Parameterized Postgres queries for projects. Every WHERE filters by user_id.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type { CursorPayload } from "@/lib/cursor";
import type {
  ListProjectsQuery,
  Project,
  ProjectCreate,
  ProjectPatch,
  ProjectRow,
} from "./types";
import { toWireProject } from "./types";

type Executor = Pick<PoolClient, "query">;

const COLS = `id, user_id, name, client_name, location, currency, tax_region, status, notes,
  counts_calculations, counts_materials, counts_boqs, counts_quotations, counts_invoices,
  created_at, updated_at, archived_at`;

export interface InsertProjectInput extends ProjectCreate {
  userId: string;
}

export async function insertProject(
  input: InsertProjectInput,
  client: Executor = getDb(),
): Promise<Project> {
  const res = await client.query<ProjectRow>(
    `INSERT INTO projects (user_id, name, client_name, location, currency, tax_region, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLS}`,
    [
      input.userId,
      input.name,
      input.clientName ?? null,
      input.location ? JSON.stringify(input.location) : null,
      input.currency,
      input.taxRegion,
      input.notes ?? null,
    ],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Insert returned no row.");
  return toWireProject(row);
}

export async function findProjectByIdForUser(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<Project | undefined> {
  const res = await client.query<ProjectRow>(
    `SELECT ${COLS} FROM projects WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? toWireProject(row) : undefined;
}

export interface ListProjectsResult {
  items: Project[];
  nextCursor: CursorPayload | null;
  hasMore: boolean;
}

export async function listProjectsForUser(
  userId: string,
  q: ListProjectsQuery,
  cursor: CursorPayload | null,
  client: Executor = getDb(),
): Promise<ListProjectsResult> {
  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (q.status === "active") conditions.push(`status = 'active'`);
  else if (q.status === "archived") conditions.push(`status = 'archived'`);

  if (q.search) {
    params.push(`%${q.search.toLowerCase()}%`);
    conditions.push(
      `(LOWER(name) LIKE $${params.length} OR LOWER(COALESCE(client_name,'')) LIKE $${params.length})`,
    );
  }

  if (cursor) {
    params.push(cursor.createdAt);
    params.push(cursor.id);
    conditions.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }

  params.push(q.limit + 1);
  const limitParamIdx = params.length;

  const res = await client.query<ProjectRow>(
    `SELECT ${COLS} FROM projects
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC, id DESC
     LIMIT $${limitParamIdx}`,
    params,
  );

  const rows = res.rows;
  const hasMore = rows.length > q.limit;
  const kept = hasMore ? rows.slice(0, q.limit) : rows;
  const last = kept[kept.length - 1];
  return {
    items: kept.map(toWireProject),
    nextCursor: hasMore && last ? { createdAt: last.created_at.toISOString(), id: last.id } : null,
    hasMore,
  };
}

export async function patchProject(
  id: string,
  userId: string,
  patch: ProjectPatch,
  client: Executor = getDb(),
): Promise<Project | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const push = (col: string, val: unknown) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };

  if (patch.name !== undefined) push("name", patch.name);
  if (patch.clientName !== undefined) push("client_name", patch.clientName);
  if (patch.location !== undefined)
    push("location", patch.location === null ? null : JSON.stringify(patch.location));
  if (patch.notes !== undefined) push("notes", patch.notes);

  if (!sets.length) return findProjectByIdForUser(id, userId, client);

  sets.push(`updated_at = NOW()`);
  params.push(id);
  params.push(userId);

  const res = await client.query<ProjectRow>(
    `UPDATE projects SET ${sets.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING ${COLS}`,
    params,
  );
  const row = res.rows[0];
  return row ? toWireProject(row) : undefined;
}

export async function archiveProjectRow(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<{ status: "ok" | "not_found" | "already_archived"; project?: Project }> {
  const res = await client.query<ProjectRow>(
    `UPDATE projects
     SET status = 'archived', archived_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'active'
     RETURNING ${COLS}`,
    [id, userId],
  );
  const row = res.rows[0];
  if (row) return { status: "ok", project: toWireProject(row) };

  const found = await findProjectByIdForUser(id, userId, client);
  if (!found) return { status: "not_found" };
  return { status: "already_archived", project: found };
}

export async function unarchiveProjectRow(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<{ status: "ok" | "not_found" | "not_archived"; project?: Project }> {
  const res = await client.query<ProjectRow>(
    `UPDATE projects
     SET status = 'active', archived_at = NULL, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'archived'
     RETURNING ${COLS}`,
    [id, userId],
  );
  const row = res.rows[0];
  if (row) return { status: "ok", project: toWireProject(row) };

  const found = await findProjectByIdForUser(id, userId, client);
  if (!found) return { status: "not_found" };
  return { status: "not_archived", project: found };
}

export async function deleteProjectRow(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<boolean> {
  const res = await client.query(
    `DELETE FROM projects WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (res.rowCount ?? 0) > 0;
}
