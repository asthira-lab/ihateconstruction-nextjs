// Database layer for audit log
import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type { AuditRow, AuditEntry, EntityType, AuditAction } from "./types";
import { toWireAuditEntry } from "./types";
import type { CursorPayload } from "@/lib/cursor";

export interface InsertAuditInput {
  projectId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  changes?: Record<string, unknown> | null;
}

export async function insertAuditEntry(input: InsertAuditInput, client: PoolClient): Promise<void> {
  await client.query(
    `INSERT INTO audit_log (project_id, user_id, entity_type, entity_id, action, summary, changes_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.projectId, input.userId, input.entityType, input.entityId, input.action, input.summary, input.changes ? JSON.stringify(input.changes) : null],
  );
}

export async function listAuditForProject(
  projectId: string,
  userId: string,
  limit: number,
  cursor: CursorPayload | null,
  entityType?: EntityType,
): Promise<{ items: AuditEntry[]; nextCursor: CursorPayload | null; hasMore: boolean }> {
  const conditions: string[] = ["project_id = $1", "user_id = $2"];
  const params: unknown[] = [projectId, userId];

  if (entityType) {
    params.push(entityType);
    conditions.push(`entity_type = $${params.length}`);
  }

  if (cursor) {
    params.push(cursor.createdAt);
    params.push(cursor.id);
    conditions.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }

  params.push(limit + 1);
  const res = await getDb().query<AuditRow>(
    `SELECT * FROM audit_log WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
    params,
  );

  const rows = res.rows;
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;
  const last = kept[kept.length - 1];

  return {
    items: kept.map(toWireAuditEntry),
    nextCursor: hasMore && last ? { createdAt: last.created_at.toISOString(), id: last.id } : null,
    hasMore,
  };
}
