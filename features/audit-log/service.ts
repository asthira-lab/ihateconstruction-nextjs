// Audit log service — logAudit helper for services + listActivityLog for the UI
import "server-only";
import type { PoolClient } from "pg";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { listAuditQuerySchema } from "./schema";
import { insertAuditEntry, listAuditForProject } from "./repo";
import type { AuditEntry, EntityType, AuditAction } from "./types";

export interface LogAuditInput {
  projectId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  changes?: Record<string, unknown> | null;
}

export async function logAudit(client: PoolClient, input: LogAuditInput): Promise<void> {
  await insertAuditEntry(input, client);
}

export interface ListActivityResult {
  items: AuditEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listActivityLog(projectId: string, rawQuery: unknown): Promise<ListActivityResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listAuditQuerySchema.safeParse(rawQuery);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const q = parsed.data;
  let cursor = null;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR:" + q.cursor);
  }

  const result = await listAuditForProject(projectId, userId, q.limit, cursor, q.entityType);
  return {
    items: result.items,
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.hasMore,
  };
}
