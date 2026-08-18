// Server-side orchestration for saved calculations. Auth + validation + transactional counts.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import {
  listCalculationsQuerySchema,
  savedCalculationCreateSchema,
  savedCalculationPatchSchema,
} from "./schema";
import type {
  CalculatorSlug,
  ListCalculationsQuery,
  SavedCalculation,
} from "./types";
import {
  deleteCalculationRow,
  findCalculationByIdForUser,
  insertCalculation,
  listCalculationsForProject,
  patchCalculationRow,
  recomputeCalculationRow,
} from "./repo";

import { brickRequestSchema } from "@/features/calculators/brick/schema";
import { computeBrick } from "@/features/calculators/brick/compute";
import { concreteRequestSchema } from "@/features/calculators/concrete/schema";
import { computeConcrete } from "@/features/calculators/concrete/compute";
import { paintRequestSchema } from "@/features/calculators/paint/schema";
import { computePaint } from "@/features/calculators/paint/compute";
import { steelRequestSchema } from "@/features/calculators/steel/schema";
import { computeSteel } from "@/features/calculators/steel/compute";
import { tileRequestSchema } from "@/features/calculators/tile/schema";
import { computeTile } from "@/features/calculators/tile/compute";
import { rebarRequestSchema } from "@/features/calculators/rebar/schema";
import { computeRebar } from "@/features/calculators/rebar/compute";
import { concreteVolumeRequestSchema } from "@/features/calculators/concrete-volume/schema";
import { computeConcreteVolume } from "@/features/calculators/concrete-volume/compute";
import { concreteSlabRequestSchema } from "@/features/calculators/concrete-slab/schema";
import { computeConcreteSlab } from "@/features/calculators/concrete-slab/compute";

const IMMUTABLE_KEYS = new Set([
  "id", "projectId", "calculator", "request", "result", "computedAt", "createdAt", "updatedAt",
]);

function assertNoImmutable(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    if (IMMUTABLE_KEYS.has(key)) throw new Error(`IMMUTABLE_FIELD:${key}`);
  }
}

// Bridge from slug + raw request to the existing calculator's compute pipeline.
async function runCalculator(
  slug: CalculatorSlug,
  rawRequest: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    switch (slug) {
      case "brick": {
        const req = brickRequestSchema.parse(rawRequest);
        return (await computeBrick(req)) as unknown as Record<string, unknown>;
      }
      case "concrete": {
        const req = concreteRequestSchema.parse(rawRequest);
        return (await computeConcrete(req)) as unknown as Record<string, unknown>;
      }
      case "paint": {
        const req = paintRequestSchema.parse(rawRequest);
        return (await computePaint(req)) as unknown as Record<string, unknown>;
      }
      case "steel": {
        const req = steelRequestSchema.parse(rawRequest);
        return (await computeSteel(req)) as unknown as Record<string, unknown>;
      }
      case "tile": {
        const req = tileRequestSchema.parse(rawRequest);
        return (await computeTile(req)) as unknown as Record<string, unknown>;
      }
      case "rebar": {
        const req = rebarRequestSchema.parse(rawRequest);
        return (await computeRebar(req)) as unknown as Record<string, unknown>;
      }
      case "concrete-volume": {
        const req = concreteVolumeRequestSchema.parse(rawRequest);
        return (await computeConcreteVolume(req)) as unknown as Record<string, unknown>;
      }
      case "concrete-slab": {
        const req = concreteSlabRequestSchema.parse(rawRequest);
        return (await computeConcreteSlab(req)) as unknown as Record<string, unknown>;
      }
      default: {
        const _exhaustive: never = slug;
        throw new Error(`UNKNOWN_CALCULATOR:${_exhaustive}`);
      }
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    if (raw.startsWith("UNKNOWN_CALCULATOR:")) throw e;
    throw new Error(`COMPUTE_FAILED:${raw}`);
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

// Atomic: gate on active+owned project via UPDATE rowcount, insert calc, increment counts.
async function insertWithCounts(
  projectId: string,
  userId: string,
  payload: {
    calculator: CalculatorSlug;
    label: string;
    description?: string | null;
    group?: string | null;
    request: Record<string, unknown>;
    result: Record<string, unknown>;
  },
): Promise<SavedCalculation> {
  return tx(async (client) => {
    const check = await client.query<{ status: string }>(
      `SELECT status FROM projects WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [projectId, userId],
    );
    const gate = check.rows[0];
    if (!gate) throw new Error("NOT_FOUND");
    if (gate.status !== "active") throw new Error("PROJECT_ARCHIVED");

    const created = await insertCalculation(
      { projectId, userId, ...payload },
      client,
    );
    await client.query(
      `UPDATE projects
       SET counts_calculations = counts_calculations + 1, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    return created;
  });
}

export async function saveCalculation(projectId: string, raw: unknown): Promise<SavedCalculation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = savedCalculationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }
  const data = parsed.data;

  const shapeB = "result" in data && data.result !== undefined;
  const result = shapeB
    ? (data.result as Record<string, unknown>)
    : await runCalculator(data.calculator, data.request);

  return insertWithCounts(projectId, userId, {
    calculator: data.calculator,
    label: data.label,
    description: data.description ?? null,
    group: data.group ?? null,
    request: data.request,
    result,
  });
}

export async function getCalculation(id: string): Promise<SavedCalculation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const found = await findCalculationByIdForUser(id, userId);
  if (!found) throw new Error("NOT_FOUND");
  return found;
}

export interface ListCalcResult {
  items: SavedCalculation[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listCalculations(projectId: string, rawQuery: unknown): Promise<ListCalcResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listCalculationsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const lim = flat.fieldErrors.limit?.[0];
    if (lim?.toLowerCase().includes("less than or equal") || lim?.toLowerCase().includes("greater than or equal")) {
      throw new Error("INVALID_LIMIT:" + lim);
    }
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }
  const q: ListCalculationsQuery = parsed.data;

  let cursor = null;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR:" + q.cursor);
  }

  const result = await listCalculationsForProject(projectId, userId, q, cursor);
  return {
    items: result.items,
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.hasMore,
  };
}

export async function patchCalculation(id: string, raw: unknown): Promise<SavedCalculation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  assertNoImmutable(raw);
  const parsed = savedCalculationPatchSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  const updated = await patchCalculationRow(id, userId, parsed.data);
  if (!updated) throw new Error("NOT_FOUND");
  return updated;
}

export async function recomputeCalculation(id: string): Promise<SavedCalculation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const found = await findCalculationByIdForUser(id, userId);
  if (!found) throw new Error("NOT_FOUND");

  const result = await runCalculator(found.calculator, found.request);
  const updated = await recomputeCalculationRow(id, userId, found.request, result);
  if (!updated) throw new Error("NOT_FOUND");
  return updated;
}

export async function deleteCalculation(id: string): Promise<void> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  await tx(async (client) => {
    const res = await deleteCalculationRow(id, userId, client);
    if (!res.deleted) throw new Error("NOT_FOUND");
    await client.query(
      `UPDATE projects
       SET counts_calculations = GREATEST(counts_calculations - 1, 0), updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [res.projectId, userId],
    );
  });
}

// Fetches the caller's active projects for the "Save to project" picker.
export async function listActiveProjectsForPicker(): Promise<Array<{ id: string; name: string }>> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const res = await getDb().query<{ id: string; name: string }>(
    `SELECT id, name FROM projects
     WHERE user_id = $1 AND status = 'active'
     ORDER BY updated_at DESC
     LIMIT 100`,
    [userId],
  );
  return res.rows;
}
