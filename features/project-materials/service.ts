// Orchestration for project materials. Auth + validation + transactional counts + currency inherit.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import {
  listMaterialsQuerySchema,
  materialCreateSchema,
  materialPatchSchema,
} from "./schema";
import type {
  ListMaterialsQuery,
  MaterialType,
  ProjectMaterial,
} from "./types";
import {
  deleteMaterialRow,
  findMaterialByIdForUser,
  insertMaterial,
  listMaterialsForProject,
  patchMaterialRow,
} from "./repo";

const IMMUTABLE_KEYS = new Set([
  "id", "projectId", "type", "unit", "currency", "createdAt", "updatedAt",
]);

function assertNoImmutable(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    if (IMMUTABLE_KEYS.has(key)) throw new Error(`IMMUTABLE_FIELD:${key}`);
  }
}

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

interface InsertPayload {
  type: MaterialType;
  brand?: string | null;
  unit: string;
  unitPrice: string;
  quantity?: string | null;
  vendor?: string | null;
  notes?: string | null;
  effectiveFrom?: string;
}

async function insertWithCounts(
  projectId: string,
  userId: string,
  payload: InsertPayload,
): Promise<ProjectMaterial> {
  return tx(async (client) => {
    const check = await client.query<{ status: string; currency: string }>(
      `SELECT status, currency FROM projects WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [projectId, userId],
    );
    const gate = check.rows[0];
    if (!gate) throw new Error("NOT_FOUND");
    if (gate.status !== "active") throw new Error("PROJECT_ARCHIVED");

    const created = await insertMaterial(
      { projectId, userId, currency: gate.currency.trim(), ...payload },
      client,
    );
    await client.query(
      `UPDATE projects
       SET counts_materials = counts_materials + 1, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    return created;
  });
}

export async function createMaterial(projectId: string, raw: unknown): Promise<ProjectMaterial> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = materialCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    const unitErr = flat.fieldErrors.unit?.find((m) => m.startsWith("UNIT_NOT_ALLOWED_FOR_TYPE:"));
    if (unitErr) throw new Error(unitErr);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  return insertWithCounts(projectId, userId, parsed.data);
}

export async function getMaterial(id: string): Promise<ProjectMaterial> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const found = await findMaterialByIdForUser(id, userId);
  if (!found) throw new Error("NOT_FOUND");
  return found;
}

export interface ListMaterialsResult {
  items: ProjectMaterial[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listMaterials(projectId: string, rawQuery: unknown): Promise<ListMaterialsResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listMaterialsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const lim = flat.fieldErrors.limit?.[0];
    if (lim?.toLowerCase().includes("less than or equal") || lim?.toLowerCase().includes("greater than or equal")) {
      throw new Error("INVALID_LIMIT:" + lim);
    }
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }
  const q: ListMaterialsQuery = parsed.data;

  let cursor = null;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR:" + q.cursor);
  }

  const result = await listMaterialsForProject(projectId, userId, q, cursor);
  return {
    items: result.items,
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.hasMore,
  };
}

export async function patchMaterial(id: string, raw: unknown): Promise<ProjectMaterial> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  assertNoImmutable(raw);
  const parsed = materialPatchSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  const updated = await patchMaterialRow(id, userId, parsed.data);
  if (!updated) throw new Error("NOT_FOUND");
  return updated;
}

export async function deleteMaterial(id: string): Promise<void> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  await tx(async (client) => {
    const res = await deleteMaterialRow(id, userId, client);
    if (!res.deleted) throw new Error("NOT_FOUND");
    await client.query(
      `UPDATE projects
       SET counts_materials = GREATEST(counts_materials - 1, 0), updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [res.projectId, userId],
    );
  });
}

// Returns the set of "type:unit:brand" keys already stored under a project — used to dedup import chips.
export async function listMaterialKeysForProject(projectId: string): Promise<Set<string>> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const res = await getDb().query<{ type: string; unit: string; brand: string | null }>(
    `SELECT type, unit, brand FROM project_materials WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
  const out = new Set<string>();
  for (const r of res.rows) {
    out.add(`${r.type}:${r.unit}:${r.brand ?? ""}`);
  }
  return out;
}

// Bulk-imports a list of suggested materials: creates new ones with placeholder unitPrice = "100",
// updates quantity on existing ones (by type+unit+brand="" key).
export async function bulkImportMaterials(
  projectId: string,
  suggestions: Array<{ type: MaterialType; unit: string; quantity?: string | null }>,
): Promise<{ created: number; updated: number }> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  return tx(async (client) => {
    const check = await client.query<{ status: string; currency: string }>(
      `SELECT status, currency FROM projects WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [projectId, userId],
    );
    const gate = check.rows[0];
    if (!gate) throw new Error("NOT_FOUND");
    if (gate.status !== "active") throw new Error("PROJECT_ARCHIVED");

    const currency = gate.currency.trim();
    // Load existing materials inside the same transaction so we don't create duplicates concurrently.
    const existing = await client.query<{ id: string; type: string; unit: string; brand: string | null }>(
      `SELECT id, type, unit, brand FROM project_materials WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    const existingByKey = new Map<string, string>(); // key → material id
    for (const r of existing.rows) {
      existingByKey.set(`${r.type}:${r.unit}:${r.brand ?? ""}`, r.id);
    }

    let created = 0;
    let updated = 0;
    for (const s of suggestions) {
      const key = `${s.type}:${s.unit}:`;
      const existingId = existingByKey.get(key);

      // Validate unit-allowed-for-type using the same rule as the create schema.
      const validated = materialCreateSchema.safeParse({
        type: s.type, unit: s.unit, unitPrice: "100",
        ...(s.quantity != null ? { quantity: s.quantity } : {}),
      });
      if (!validated.success) continue;

      if (existingId) {
        // Material exists — update its quantity if supplied
        if (s.quantity != null) {
          await client.query(
            `UPDATE project_materials SET quantity = $1::numeric, updated_at = NOW()
             WHERE id = $2 AND user_id = $3`,
            [s.quantity, existingId, userId],
          );
          updated++;
        }
      } else {
        // Material doesn't exist — create it
        await insertMaterial(
          {
            projectId, userId, currency,
            type: s.type, unit: s.unit, unitPrice: "100",
            quantity: s.quantity ?? null,
          },
          client,
        );
        existingByKey.set(key, ""); // mark as created (don't need real id)
        created++;
      }
    }
    if (created > 0) {
      await client.query(
        `UPDATE projects
         SET counts_materials = counts_materials + $3, updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [projectId, userId, created],
      );
    }
    return { created, updated };
  });
}
