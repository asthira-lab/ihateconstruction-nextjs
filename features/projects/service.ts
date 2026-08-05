// Server-side orchestration for the Projects API. Auth + validation + persistence.

import "server-only";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { withIdempotency } from "@/lib/idempotency";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import {
  archiveProjectRow,
  deleteProjectRow,
  findProjectByIdForUser,
  insertProject,
  listProjectsForUser,
  patchProject as patchProjectRow,
  unarchiveProjectRow,
} from "./repo";
import {
  listProjectsQuerySchema,
  projectCreateSchema,
  projectPatchSchema,
} from "./schema";
import type {
  ListProjectsQuery,
  Project,
  ProjectPatch,
} from "./types";

// Keys the spec marks immutable — never allowed in a PATCH body.
const IMMUTABLE_KEYS = new Set(["currency", "taxRegion", "status", "id", "createdAt", "updatedAt", "archivedAt", "counts"]);

function assertNoImmutable(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    if (IMMUTABLE_KEYS.has(key)) throw new Error(`IMMUTABLE_FIELD:${key}`);
  }
}

export async function createProject(
  raw: unknown,
  idempotencyKey?: string,
): Promise<Project> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = projectCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  if (idempotencyKey) {
    return withIdempotency(
      userId,
      idempotencyKey,
      "project",
      (client) => insertProject({ userId, ...parsed.data }, client),
      async (id, client) => findProjectByIdForUser(id, userId, client),
    );
  }
  return insertProject({ userId, ...parsed.data });
}

export async function getProject(id: string): Promise<Project> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const found = await findProjectByIdForUser(id, userId);
  if (!found) throw new Error("NOT_FOUND");
  return found;
}

export interface ListProjectsResult {
  items: Project[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listProjects(rawQuery: unknown): Promise<ListProjectsResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listProjectsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const message = flat.fieldErrors.limit?.[0];
    if (message?.toLowerCase().includes("less than or equal") || message?.toLowerCase().includes("greater than or equal")) {
      throw new Error("INVALID_LIMIT:" + message);
    }
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  const q: ListProjectsQuery = parsed.data;
  let cursor = null;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR:" + q.cursor);
  }

  const result = await listProjectsForUser(userId, q, cursor);
  return {
    items: result.items,
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.hasMore,
  };
}

export async function patchProject(id: string, raw: unknown): Promise<Project> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  assertNoImmutable(raw);
  const parsed = projectPatchSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  const patch: ProjectPatch = parsed.data;
  const updated = await patchProjectRow(id, userId, patch);
  if (!updated) throw new Error("NOT_FOUND");
  return updated;
}

export async function archiveProject(id: string): Promise<Project> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const res = await archiveProjectRow(id, userId);
  if (res.status === "not_found") throw new Error("NOT_FOUND");
  if (res.status === "already_archived") throw new Error("ALREADY_ARCHIVED");
  return res.project!;
}

export async function unarchiveProject(id: string): Promise<Project> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const res = await unarchiveProjectRow(id, userId);
  if (res.status === "not_found") throw new Error("NOT_FOUND");
  if (res.status === "not_archived") throw new Error("NOT_ARCHIVED");
  return res.project!;
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const ok = await deleteProjectRow(id, userId);
  if (!ok) throw new Error("NOT_FOUND");
}
